import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Match, MatchEvent, MatchStatus } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { MatchesService } from '../../core/services/matches.service';
import { PredictionsService } from '../../core/services/predictions.service';
import { roundLabel } from '../../core/utils/dates';
import { errorMessage } from '../../core/utils/errors';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { MatchStatusPipe } from '../../shared/pipes/match-status.pipe';

const STATUS_SHORT: Record<MatchStatus, string> = {
  scheduled: 'NS',
  live: 'LIVE',
  finished: 'FT',
  postponed: 'PST',
  cancelled: 'CANC',
};

@Component({
  selector: 'app-match-detail',
  imports: [RouterLink, FormsModule, DatePipe, MatchStatusPipe, ImgFallbackDirective],
  templateUrl: './match-detail.component.html',
})
export class MatchDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchesApi = inject(MatchesService);
  private readonly favorites = inject(FavoritesService);
  private readonly predictionsApi = inject(PredictionsService);
  readonly auth = inject(AuthService);

  readonly roundLabel = roundLabel;

  readonly match = signal<Match | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly isFavorite = computed(() => this.favorites.isMatchFavorite(this.match()?._id));
  readonly myPrediction = computed(() => {
    const m = this.match();
    return m ? this.predictionsApi.predictionFor(m._id) : undefined;
  });
  readonly events = computed(() =>
    [...(this.match()?.events ?? [])].sort((a, b) => a.time - b.time),
  );
  readonly hasScore = computed(() => {
    const m = this.match();
    return !!m && m.homeScore !== null && m.awayScore !== null;
  });
  readonly predictionResult = computed(() => {
    const m = this.match();
    const p = this.myPrediction();
    if (!m || !p || m.status !== 'finished' || !this.hasScore()) return 'pending';
    return p.homeScore === m.homeScore && p.awayScore === m.awayScore ? 'correct' : 'incorrect';
  });

  
  predHome: number | null = null;
  predAway: number | null = null;
  readonly predSaving = signal(false);
  readonly predMessage = signal('');
  readonly predError = signal('');

 
  editHome: number | null = null;
  editAway: number | null = null;
  editStatus: MatchStatus = 'scheduled';
  editElapsed: number | null = null;
  readonly statusOptions: { value: MatchStatus; label: string }[] = [
    { value: 'scheduled', label: 'Programado' },
    { value: 'live', label: 'En vivo' },
    { value: 'finished', label: 'Finalizado' },
    { value: 'postponed', label: 'Postergado' },
    { value: 'cancelled', label: 'Suspendido / cancelado' },
  ];
  readonly adminSaving = signal(false);
  readonly adminMessage = signal('');
  readonly adminError = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id') ?? '';
      this.load(id);
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.match.set(null);
    this.matchesApi.getDetail(id).subscribe({
      next: (m) => {
        this.match.set(m);
        this.fillForms(m);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private fillForms(m: Match): void {
    this.editHome = m.homeScore;
    this.editAway = m.awayScore;
    this.editStatus = m.status;
    this.editElapsed = m.elapsed;
    const p = this.predictionsApi.predictionFor(m._id);
    this.predHome = p ? p.homeScore : null;
    this.predAway = p ? p.awayScore : null;
  }



  toggleFavorite(): void {
    const m = this.match();
    if (!m) return;
    this.favorites.toggleMatch(m._id).subscribe({
      error: (err) => alert(errorMessage(err)),
    });
  }

 

  savePrediction(): void {
    const m = this.match();
    if (!m) return;
    this.predMessage.set('');
    this.predError.set('');

    const h = this.predHome;
    const a = this.predAway;
    if (h === null || a === null || !Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      this.predError.set('Ingresá los dos resultados (números enteros, 0 o más).');
      return;
    }

    this.predSaving.set(true);
    this.predictionsApi.save(m._id, h, a).subscribe({
      next: () => {
        this.predMessage.set('¡Predicción guardada!');
        this.predSaving.set(false);
      },
      error: (err) => {
        this.predError.set(errorMessage(err));
        this.predSaving.set(false);
      },
    });
  }

 

  saveAdminChanges(): void {
    const m = this.match();
    if (!m) return;
    this.adminMessage.set('');
    this.adminError.set('');

    const scoreOk = (v: number | null) => v === null || (Number.isInteger(v) && v >= 0);
    if (!scoreOk(this.editHome) || !scoreOk(this.editAway)) {
      this.adminError.set('Los goles deben ser números enteros, 0 o más (o vacío).');
      return;
    }

    this.adminSaving.set(true);
    this.matchesApi
      .update(m._id, {
        homeScore: this.editHome,
        awayScore: this.editAway,
        status: this.editStatus,
        statusShort: STATUS_SHORT[this.editStatus],
        elapsed: this.editStatus === 'live' ? this.editElapsed : null,
      })
      .subscribe({
        next: (updated) => {
          this.match.set(updated);
          this.adminMessage.set('Partido actualizado.');
          this.adminSaving.set(false);
        },
        error: (err) => {
          this.adminError.set(errorMessage(err));
          this.adminSaving.set(false);
        },
      });
  }

  deleteMatch(): void {
    const m = this.match();
    if (!m) return;
    if (!confirm(`¿Eliminar "${m.homeTeam} vs ${m.awayTeam}" de la base de datos?`)) return;
    this.matchesApi.remove(m._id).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => this.adminError.set(errorMessage(err)),
    });
  }



  eventIcon(e: MatchEvent): string {
    if (e.type === 'Goal') return e.detail === 'Missed Penalty' ? '❌' : '⚽';
    if (e.type === 'Card') return e.detail.toLowerCase().includes('red') ? '🟥' : '🟨';
    if (e.type === 'subst') return '🔁';
    if (e.type === 'Var') return '📺';
    return '•';
  }

  eventLabel(e: MatchEvent): string {
    if (e.type === 'Goal') {
      const map: Record<string, string> = {
        'Normal Goal': 'Gol',
        Penalty: 'Gol de penal',
        'Own Goal': 'Gol en contra',
        'Missed Penalty': 'Penal errado',
      };
      return map[e.detail] ?? 'Gol';
    }
    if (e.type === 'Card') {
      const d = e.detail.toLowerCase();
      if (d.includes('second')) return 'Doble amarilla';
      return d.includes('red') ? 'Roja' : 'Amarilla';
    }
    if (e.type === 'subst') return 'Cambio';
    if (e.type === 'Var') return `VAR · ${e.detail}`;
    return e.detail;
  }

  isHomeEvent(e: MatchEvent): boolean {
    return e.team === this.match()?.homeTeam;
  }
}
