import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemResponse, ListResponse, MessageResponse, User, UserRole } from '../models/models';

/** Endpoints de administración de usuarios (solo rol admin). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  /** GET /users */
  listUsers(): Observable<User[]> {
    return this.http.get<ListResponse<User>>(this.base).pipe(map((r) => r.data));
  }

  /** GET /users/find/:username */
  findUser(username: string): Observable<User> {
    return this.http
      .get<ItemResponse<User>>(`${this.base}/find/${encodeURIComponent(username)}`)
      .pipe(map((r) => r.data));
  }

  /** PUT /users/:username/role */
  changeRole(username: string, role: UserRole): Observable<User> {
    return this.http
      .put<ItemResponse<User>>(`${this.base}/${encodeURIComponent(username)}/role`, { role })
      .pipe(map((r) => r.data));
  }

  /** PUT /users/:username/unlock */
  unlock(username: string): Observable<User> {
    return this.http
      .put<ItemResponse<User>>(`${this.base}/${encodeURIComponent(username)}/unlock`, {})
      .pipe(map((r) => r.data));
  }

  /** DELETE /users/:username */
  deleteUser(username: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/${encodeURIComponent(username)}`);
  }
}
