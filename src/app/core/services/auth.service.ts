import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ItemResponse, MessageResponse, User } from '../models/models';

const TOKEN_KEY = 'football_token';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  readonly token = signal<string | null>(this.readToken());
  readonly user = signal<User | null>(null);

  readonly isLoggedIn = computed(() => !!this.token());
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  private pending$?: Observable<User | null>;


  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, { email, password })
      .pipe(tap((r) => this.startSession(r)));
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, { username, email, password })
      .pipe(tap((r) => this.startSession(r)));
  }

 
  logout(): Observable<unknown> {
    return this.http.post<MessageResponse>(`${this.base}/logout`, {}).pipe(
      catchError(() => of(null)),
      finalize(() => this.clearSession()),
    );
  }


  ensureUser(): Observable<User | null> {
    const current = this.user();
    if (current) return of(current);
    if (!this.token()) return of(null);

    if (!this.pending$) {
      this.pending$ = this.http.get<ItemResponse<User>>(`${this.base}/me`).pipe(
        map((r) => r.data),
        tap((u) => this.user.set(u)),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) this.clearSession();
          return of(null);
        }),
        finalize(() => (this.pending$ = undefined)),
        shareReplay(1),
      );
    }
    return this.pending$;
  }

 
  fetchMe(): Observable<User> {
    return this.http.get<ItemResponse<User>>(`${this.base}/me`).pipe(
      map((r) => r.data),
      tap((u) => this.user.set(u)),
    );
  }

  setUser(user: User): void {
    this.user.set(user);
  }

  clearSession(): void {
    this.token.set(null);
    this.user.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
     
    }
  }



  private startSession(r: AuthResponse): void {
    this.token.set(r.token);
    this.user.set(r.user);
    try {
      localStorage.setItem(TOKEN_KEY, r.token);
    } catch {
      
    }
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
