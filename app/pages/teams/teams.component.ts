import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamSearchResult } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { TeamsService } from '../../core/services/teams.service';
import { errorMessage } from '../../core/utils/errors';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';

@Component({
  selector: 'app-teams',
  imports: [FormsModule, RouterLink, ImgFallbackDirective],
  templateUrl: './teams.component.html',
})
export class TeamsComponent {
  private readonly teamsApi = inject(TeamsService);
  private readonly favorites = inject(FavoritesService);
  readonly auth = inject(AuthService);

  query = '';
  readonly results = signal<TeamSearchResult[]>([]);
  readonly searched = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly busyTeamId = signal<number | null>(null);

  search(): void {
    const q = this.query.trim();
    this.error.set('');
    if (q.length < 3) {
      this.error.set('Escribí al menos 3 letras para buscar.');
      return;
    }
    this.loading.set(true);
    this.teamsApi.search(q).subscribe({
      next: (list) => {
        this.results.set(list);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  isFavorite(teamId: number): boolean {
    return this.favorites.isTeamFavorite(teamId);
  }

  toggleFavorite(teamId: number): void {
    this.busyTeamId.set(teamId);
    this.favorites.toggleTeam(teamId).subscribe({
      next: () => this.busyTeamId.set(null),
      error: (err) => {
        this.busyTeamId.set(null);
        alert(errorMessage(err));
      },
    });
  }
}
