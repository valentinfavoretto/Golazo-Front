import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatchRowData } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { errorMessage } from '../../core/utils/errors';
import { ImgFallbackDirective } from '../directives/img-fallback.directive';
import { MatchStatusPipe } from '../pipes/match-status.pipe';

@Component({
  selector: 'app-match-row',
  imports: [MatchStatusPipe, ImgFallbackDirective],
  templateUrl: './match-row.component.html',
})
export class MatchRowComponent {
  readonly match = input.required<MatchRowData>();
  
  readonly showDate = input(false);
  readonly showFavorite = input(true);

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);

  readonly isFav = computed(() => this.favorites.isMatchFavorite(this.match()._id));
  readonly canFavorite = computed(
    () => this.showFavorite() && !!this.match()._id && this.auth.isLoggedIn(),
  );
  readonly hasScore = computed(() => {
    const m = this.match();
    return m.homeScore !== null && m.awayScore !== null;
  });

  open(): void {
    const id = this.match()._id;
    if (id) this.router.navigate(['/partido', id]);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    const id = this.match()._id;
    if (!id) return;
    this.favorites.toggleMatch(id).subscribe({
      error: (err) => alert(errorMessage(err)),
    });
  }
}
