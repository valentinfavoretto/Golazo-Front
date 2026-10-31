import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FavoriteTeam, ItemResponse, User } from '../models/models';
import { AuthService } from './auth.service';

/**
 * Favoritos del usuario. El estado vive en el usuario de AuthService:
 * cada vez que el backend responde con el usuario actualizado, lo guardamos
 * ahí y las estrellas de toda la app se actualizan solas (computed).
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/users/favorites`;

  /** ids de partidos favoritos (en /me vienen populados, en otras respuestas como ids) */
  readonly matchIds = computed(() => {
    const list = this.auth.user()?.favoriteMatches ?? [];
    return new Set(list.map((m) => (typeof m === 'string' ? m : m._id)));
  });

  readonly teams = computed<FavoriteTeam[]>(() => this.auth.user()?.favoriteTeams ?? []);
  readonly teamIds = computed(() => new Set(this.teams().map((t) => t.teamId)));

  isMatchFavorite(id?: string): boolean {
    return !!id && this.matchIds().has(id);
  }

  isTeamFavorite(teamId: number): boolean {
    return this.teamIds().has(teamId);
  }

  // ── Partidos ───────────────────────────────────────────────────────────────

  addMatch(matchId: string): Observable<ItemResponse<User>> {
    return this.http
      .post<ItemResponse<User>>(`${this.base}/matches/${matchId}`, {})
      .pipe(tap((r) => this.auth.setUser(r.data)));
  }

  removeMatch(matchId: string): Observable<ItemResponse<User>> {
    return this.http
      .delete<ItemResponse<User>>(`${this.base}/matches/${matchId}`)
      .pipe(tap((r) => this.auth.setUser(r.data)));
  }

  toggleMatch(matchId: string): Observable<ItemResponse<User>> {
    return this.isMatchFavorite(matchId) ? this.removeMatch(matchId) : this.addMatch(matchId);
  }

  // ── Equipos ────────────────────────────────────────────────────────────────

  addTeam(teamId: number): Observable<ItemResponse<User>> {
    return this.http
      .post<ItemResponse<User>>(`${this.base}/teams`, { teamId })
      .pipe(tap((r) => this.auth.setUser(r.data)));
  }

  removeTeam(teamId: number): Observable<ItemResponse<User>> {
    return this.http
      .delete<ItemResponse<User>>(`${this.base}/teams/${teamId}`)
      .pipe(tap((r) => this.auth.setUser(r.data)));
  }

  toggleTeam(teamId: number): Observable<ItemResponse<User>> {
    return this.isTeamFavorite(teamId) ? this.removeTeam(teamId) : this.addTeam(teamId);
  }
}
