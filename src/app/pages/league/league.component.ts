import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Fixture, Match, StandingRow } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { CompetitionsService } from '../../core/services/competitions.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { MatchesService } from '../../core/services/matches.service';
import { roundLabel } from '../../core/utils/dates';
import { errorMessage } from '../../core/utils/errors';
import { getLeague, leagueLogo } from '../../core/utils/leagues';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { MatchRowComponent } from '../../shared/match-row/match-row.component';

type LeagueTab = 'standings' | 'today' | 'fixture';

interface Zone {
  cls: string;
  label: string;
}

@Component({
  selector: 'app-league',
  imports: [RouterLink, MatchRowComponent, ImgFallbackDirective],
  templateUrl: './league.component.html',
})
export class LeagueComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly competitions = inject(CompetitionsService);
  private readonly matchesApi = inject(MatchesService);
  private readonly favorites = inject(FavoritesService);
  private readonly auth = inject(AuthService);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly roundLabel = roundLabel;

  readonly leagueId = signal(0);
  readonly league = computed(() => getLeague(this.leagueId()));
  readonly logo = computed(() => leagueLogo(this.leagueId()));

  readonly tab = signal<LeagueTab>('standings');
  readonly loading = signal(false);
  readonly error = signal('');

 
  readonly standings = signal<StandingRow[]>([]);
  readonly season = signal<number | null>(null);

  
  readonly todayMatches = signal<Match[]>([]);

 
  readonly fixtures = signal<Fixture[]>([]);
  readonly selectedRound = signal('');

  private loaded = { standings: false, today: false, fixture: false };

 
  readonly rounds = computed(() => {
    const firstDate = new Map<string, number>();
    for (const f of this.fixtures()) {
      const t = new Date(f.date).getTime();
      const prev = firstDate.get(f.round);
      if (prev === undefined || t < prev) firstDate.set(f.round, t);
    }
    return [...firstDate.entries()].sort((a, b) => a[1] - b[1]).map(([round]) => round);
  });

  readonly roundIndex = computed(() => this.rounds().indexOf(this.selectedRound()));

  readonly roundMatches = computed(() =>
    this.fixtures()
      .filter((f) => f.round === this.selectedRound())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

 
  readonly zones = computed<Zone[]>(() => {
    const seen = new Map<string, Zone>();
    for (const row of this.standings()) {
      if (row.description && !seen.has(row.description)) {
        seen.set(row.description, { cls: this.zoneClass(row.description), label: row.description });
      }
    }
    return [...seen.values()];
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      this.leagueId.set(id);
      this.loaded = { standings: false, today: false, fixture: false };
      this.standings.set([]);
      this.todayMatches.set([]);
      this.fixtures.set([]);
      this.selectedRound.set('');
      this.season.set(null);
      this.error.set('');

      if (!getLeague(id)) {
        this.error.set('Esa competición no está habilitada.');
        return;
      }
      this.selectTab('standings');
    });
  }

  selectTab(tab: LeagueTab): void {
    this.tab.set(tab);
    this.error.set('');
    if (tab === 'standings' && !this.loaded.standings) this.loadStandings();
    if (tab === 'today' && !this.loaded.today) this.loadToday();
    if (tab === 'fixture' && !this.loaded.fixture) this.loadFixture();
  }

  reload(): void {
    this.selectTab(this.tab());
  }

 

  private loadStandings(): void {
    const id = this.leagueId();
    this.loading.set(true);
    this.competitions.getStandings(id).subscribe({
      next: (r) => {
        if (id !== this.leagueId()) return;
        this.standings.set(r.data);
        this.season.set(r.season);
        this.loaded.standings = true;
        this.loading.set(false);
      },
      error: (err) => {
        if (id !== this.leagueId()) return;
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private loadToday(): void {
    const id = this.leagueId();
    this.loading.set(true);
    this.matchesApi.getByCompetition(id).subscribe({
      next: (list) => {
        if (id !== this.leagueId()) return;
        this.todayMatches.set(list);
        this.loaded.today = true;
        this.loading.set(false);
      },
      error: (err) => {
        if (id !== this.leagueId()) return;
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private loadFixture(): void {
    const id = this.leagueId();
    this.loading.set(true);
    this.competitions.getFixtures(id).subscribe({
      next: (r) => {
        if (id !== this.leagueId()) return;
        this.fixtures.set(r.data);
        this.season.set(r.season);
        this.selectedRound.set(this.pickCurrentRound());
        this.loaded.fixture = true;
        this.loading.set(false);
      },
      error: (err) => {
        if (id !== this.leagueId()) return;
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

 
  private pickCurrentRound(): string {
    const rounds = this.rounds();
    if (rounds.length === 0) return '';
    for (const round of rounds) {
      const pending = this.fixtures().some(
        (f) => f.round === round && (f.status === 'scheduled' || f.status === 'live'),
      );
      if (pending) return round;
    }
    return rounds[rounds.length - 1];
  }



  goRound(delta: number): void {
    const idx = this.roundIndex() + delta;
    const rounds = this.rounds();
    if (idx >= 0 && idx < rounds.length) this.selectedRound.set(rounds[idx]);
  }

  onRoundChange(event: Event): void {
    this.selectedRound.set((event.target as HTMLSelectElement).value);
  }

 

  zoneClass(description: string | null): string {
    const d = (description ?? '').toLowerCase();
    if (!d) return 'zone-none';
    if (d.includes('relegation')) return 'zone-rel';
    if (d.includes('champions') || d.includes('libertadores') || d.includes('promotion') || d.includes('final')) {
      return 'zone-top';
    }
    if (d.includes('europa') || d.includes('sudamericana')) return 'zone-mid';
    if (d.includes('conference')) return 'zone-low';
    return 'zone-none';
  }

  formChars(form: string | null): string[] {
    return (form ?? '').split('').slice(-5);
  }

  formLabel(c: string): string {
    return c === 'W' ? 'G' : c === 'D' ? 'E' : c === 'L' ? 'P' : c;
  }

  isFavoriteTeam(teamId: number): boolean {
    return this.favorites.isTeamFavorite(teamId);
  }

  toggleTeam(teamId: number): void {
    this.favorites.toggleTeam(teamId).subscribe({
      error: (err) => alert(errorMessage(err)),
    });
  }
}
