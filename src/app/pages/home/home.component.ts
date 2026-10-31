import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { MatchesService } from '../../core/services/matches.service';
import { shortDayLabel, utcDateString } from '../../core/utils/dates';
import { errorMessage } from '../../core/utils/errors';
import { getLeague, leagueLogo, leagueOrder } from '../../core/utils/leagues';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { MatchRowComponent } from '../../shared/match-row/match-row.component';

type Tab = 'all' | 'live';

interface LeagueGroup {
  competitionId: number;
  name: string;
  logo: string;
  matches: Match[];
}

const REFRESH_MS = 2 * 60 * 1000; // refresco automático solo si hay partidos en vivo

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatchRowComponent, ImgFallbackDirective],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly matchesApi = inject(MatchesService);
  private readonly favorites = inject(FavoritesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoggedIn = this.auth.isLoggedIn;

  /** -1 = ayer, 0 = hoy, 1 = mañana (el backend solo permite esos tres días) */
  readonly offset = signal(0);
  readonly tab = signal<Tab>('all');
  readonly onlyFavorites = signal(false);

  readonly dayMatches = signal<Match[]>([]);
  readonly liveMatches = signal<Match[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  private requestSeq = 0;

  readonly dateStr = computed(() => utcDateString(this.offset()));
  readonly dayLabel = computed(() => shortDayLabel(this.dateStr()));
  readonly title = computed(() => {
    if (this.tab() === 'live') return 'EN VIVO AHORA';
    return ['PARTIDOS DE AYER', 'PARTIDOS DE HOY', 'PARTIDOS DE MAÑANA'][this.offset() + 1];
  });
  readonly liveCount = computed(() => this.dayMatches().filter((m) => m.status === 'live').length);

  private readonly source = computed(() =>
    this.tab() === 'live' ? this.liveMatches() : this.dayMatches(),
  );

  private readonly filtered = computed(() => {
    const list = this.source();
    if (!this.onlyFavorites()) return list;
    const ids = this.favorites.matchIds();
    const teamNames = new Set(this.favorites.teams().map((t) => t.teamName.toLowerCase()));
    return list.filter(
      (m) =>
        ids.has(m._id) ||
        teamNames.has(m.homeTeam.toLowerCase()) ||
        teamNames.has(m.awayTeam.toLowerCase()),
    );
  });

  /** Partidos agrupados por competición (en el mismo orden que el menú lateral). */
  readonly groups = computed<LeagueGroup[]>(() => {
    const map = new Map<number, LeagueGroup>();
    for (const m of this.filtered()) {
      let g = map.get(m.competitionId);
      if (!g) {
        g = {
          competitionId: m.competitionId,
          name: getLeague(m.competitionId)?.name ?? m.competition,
          logo: m.competitionLogo || leagueLogo(m.competitionId),
          matches: [],
        };
        map.set(m.competitionId, g);
      }
      g.matches.push(m);
    }
    return [...map.values()].sort(
      (a, b) => leagueOrder(a.competitionId) - leagueOrder(b.competitionId),
    );
  });

  ngOnInit(): void {
    this.loadDay(false);

    const timer = setInterval(() => {
      if (this.offset() === 0 && this.liveCount() > 0 && !document.hidden) {
        this.refresh(true);
      }
    }, REFRESH_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  setOffset(value: number): void {
    if (value < -1 || value > 1 || value === this.offset()) return;
    this.offset.set(value);
    this.loadDay(false);
  }

  selectTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'live') this.loadLive(false);
  }

  toggleFavorites(): void {
    this.onlyFavorites.update((v) => !v);
  }

  refresh(silent: boolean): void {
    if (this.tab() === 'live') this.loadLive(silent);
    else this.loadDay(silent);
  }

  private loadDay(silent: boolean): void {
    const seq = ++this.requestSeq;
    if (!silent) this.loading.set(true);
    this.error.set('');

    const request$ =
      this.offset() === 0 ? this.matchesApi.getToday() : this.matchesApi.getByDate(this.dateStr());

    request$.subscribe({
      next: (list) => {
        if (seq !== this.requestSeq) return; // llegó una respuesta vieja
        this.dayMatches.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        if (seq !== this.requestSeq) return;
        if (!silent) this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private loadLive(silent: boolean): void {
    const seq = ++this.requestSeq;
    if (!silent) this.loading.set(true);
    this.error.set('');

    this.matchesApi.getLive().subscribe({
      next: (list) => {
        if (seq !== this.requestSeq) return;
        this.liveMatches.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        if (seq !== this.requestSeq) return;
        if (!silent) this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
