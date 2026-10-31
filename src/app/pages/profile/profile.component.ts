import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FavoriteMatch, PredictionDetail } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PredictionsService } from '../../core/services/predictions.service';
import { errorMessage } from '../../core/utils/errors';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { MatchRowComponent } from '../../shared/match-row/match-row.component';

type ProfileTab = 'favorites' | 'predictions' | 'account';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, DatePipe, MatchRowComponent, ImgFallbackDirective],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);
  private readonly predictionsApi = inject(PredictionsService);
  private readonly router = inject(Router);

  readonly tab = signal<ProfileTab>('favorites');
  readonly loading = signal(true);
  readonly error = signal('');

  readonly favMatches = signal<FavoriteMatch[]>([]);
  readonly favTeams = this.favorites.teams;

  readonly predictions = signal<PredictionDetail[]>([]);
  readonly predictionsLoaded = signal(false);
  readonly predictionsLoading = signal(false);
  readonly predictionsError = signal('');

  readonly stats = computed(() => {
    const list = this.predictions();
    const correct = list.filter((p) => p.result === 'correct').length;
    const incorrect = list.filter((p) => p.result === 'incorrect').length;
    const resolved = correct + incorrect;
    return {
      total: list.length,
      correct,
      incorrect,
      pending: list.length - resolved,
      accuracy: resolved > 0 ? Math.round((correct / resolved) * 100) : null,
    };
  });

  ngOnInit(): void {
    
    this.auth.fetchMe().subscribe({
      next: (user) => {
        this.favMatches.set(
          user.favoriteMatches.filter((m): m is FavoriteMatch => typeof m !== 'string'),
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  selectTab(tab: ProfileTab): void {
    this.tab.set(tab);
    if (tab === 'predictions' && !this.predictionsLoaded()) this.loadPredictions();
  }

  private loadPredictions(): void {
    this.predictionsLoading.set(true);
    this.predictionsError.set('');
    this.predictionsApi.list().subscribe({
      next: (list) => {
        this.predictions.set(list);
        this.predictionsLoaded.set(true);
        this.predictionsLoading.set(false);
      },
      error: (err) => {
        this.predictionsError.set(errorMessage(err));
        this.predictionsLoading.set(false);
      },
    });
  }

  removeMatch(id: string): void {
    this.favorites.removeMatch(id).subscribe({
      next: () => this.favMatches.update((list) => list.filter((m) => m._id !== id)),
      error: (err) => alert(errorMessage(err)),
    });
  }

  removeTeam(teamId: number): void {
    this.favorites.removeTeam(teamId).subscribe({
      error: (err) => alert(errorMessage(err)),
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/']));
  }
}
