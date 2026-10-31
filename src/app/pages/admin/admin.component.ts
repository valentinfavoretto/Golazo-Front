import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Match, MatchStatus, User, UserRole } from '../../core/models/models';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { MatchesService } from '../../core/services/matches.service';
import { errorMessage } from '../../core/utils/errors';

type AdminTab = 'users' | 'matches';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly adminApi = inject(AdminService);
  private readonly matchesApi = inject(MatchesService);
  private readonly auth = inject(AuthService);

  readonly tab = signal<AdminTab>('users');
  readonly myUsername = computed(() => this.auth.user()?.username ?? '');

  // ── Usuarios ───────────────────────────────────────────────────────────────
  readonly users = signal<User[]>([]);
  readonly usersLoading = signal(false);
  readonly usersError = signal('');
  readonly usersInfo = signal('');
  userSearch = '';

  // ── Partidos ───────────────────────────────────────────────────────────────
  readonly matches = signal<Match[]>([]);
  readonly matchesLoaded = signal(false);
  readonly matchesLoading = signal(false);
  readonly matchesError = signal('');
  readonly matchText = signal('');
  readonly matchStatusFilter = signal<MatchStatus | ''>('');
  readonly page = signal(1);

  readonly statusLabels: Record<MatchStatus, string> = {
    scheduled: 'Programado',
    live: 'En vivo',
    finished: 'Finalizado',
    postponed: 'Postergado',
    cancelled: 'Suspendido',
  };
  readonly statusKeys = Object.keys(this.statusLabels) as MatchStatus[];

  readonly filteredMatches = computed(() => {
    const text = this.matchText().trim().toLowerCase();
    const status = this.matchStatusFilter();
    return this.matches().filter((m) => {
      if (status && m.status !== status) return false;
      if (!text) return true;
      return (
        m.homeTeam.toLowerCase().includes(text) ||
        m.awayTeam.toLowerCase().includes(text) ||
        m.competition.toLowerCase().includes(text)
      );
    });
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredMatches().length / PAGE_SIZE)));
  readonly pageItems = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filteredMatches().slice(start, start + PAGE_SIZE);
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  selectTab(tab: AdminTab): void {
    this.tab.set(tab);
    if (tab === 'matches' && !this.matchesLoaded()) this.loadMatches();
  }

  // ── Usuarios: acciones ─────────────────────────────────────────────────────

  loadUsers(): void {
    this.usersLoading.set(true);
    this.usersError.set('');
    this.adminApi.listUsers().subscribe({
      next: (list) => {
        this.users.set(list);
        this.usersLoading.set(false);
      },
      error: (err) => {
        this.usersError.set(errorMessage(err));
        this.usersLoading.set(false);
      },
    });
  }

  searchUser(): void {
    const name = this.userSearch.trim();
    this.usersInfo.set('');
    if (!name) {
      this.loadUsers();
      return;
    }
    this.usersLoading.set(true);
    this.usersError.set('');
    this.adminApi.findUser(name).subscribe({
      next: (user) => {
        this.users.set([user]);
        this.usersLoading.set(false);
      },
      error: (err) => {
        this.users.set([]);
        this.usersError.set(errorMessage(err));
        this.usersLoading.set(false);
      },
    });
  }

  clearSearch(): void {
    this.userSearch = '';
    this.usersInfo.set('');
    this.loadUsers();
  }

  changeRole(user: User, role: UserRole): void {
    this.usersInfo.set('');
    this.adminApi.changeRole(user.username, role).subscribe({
      next: (updated) => {
        this.replaceUser(updated);
        this.usersInfo.set(`Rol de "${updated.username}" actualizado a ${updated.role}.`);
      },
      error: (err) => this.usersError.set(errorMessage(err)),
    });
  }

  unlock(user: User): void {
    this.usersInfo.set('');
    this.adminApi.unlock(user.username).subscribe({
      next: () => this.usersInfo.set(`Cuenta de "${user.username}" desbloqueada.`),
      error: (err) => this.usersError.set(errorMessage(err)),
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`)) return;
    this.usersInfo.set('');
    this.adminApi.deleteUser(user.username).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u._id !== user._id));
        this.usersInfo.set(`Usuario "${user.username}" eliminado.`);
      },
      error: (err) => this.usersError.set(errorMessage(err)),
    });
  }

  private replaceUser(updated: User): void {
    this.users.update((list) => list.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
  }

  // ── Partidos: acciones ─────────────────────────────────────────────────────

  loadMatches(): void {
    this.matchesLoading.set(true);
    this.matchesError.set('');
    this.matchesApi.getAll().subscribe({
      next: (list) => {
        this.matches.set(list);
        this.matchesLoaded.set(true);
        this.matchesLoading.set(false);
      },
      error: (err) => {
        this.matchesError.set(errorMessage(err));
        this.matchesLoading.set(false);
      },
    });
  }

  setMatchText(value: string): void {
    this.matchText.set(value);
    this.page.set(1);
  }

  setStatusFilter(value: string): void {
    this.matchStatusFilter.set(value as MatchStatus | '');
    this.page.set(1);
  }

  goPage(delta: number): void {
    const next = this.page() + delta;
    if (next >= 1 && next <= this.pageCount()) this.page.set(next);
  }

  deleteMatch(m: Match): void {
    if (!confirm(`¿Eliminar "${m.homeTeam} vs ${m.awayTeam}"?`)) return;
    this.matchesApi.remove(m._id).subscribe({
      next: () => this.matches.update((list) => list.filter((x) => x._id !== m._id)),
      error: (err) => this.matchesError.set(errorMessage(err)),
    });
  }
}
