import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemResponse, ListResponse, MessageResponse, Match, MatchStatus } from '../models/models';

export interface MatchUpdate {
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  statusShort: string;
  elapsed: number | null;
}

/** Endpoints /api/matches/... */
@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/matches`;

  /** GET /matches/today */
  getToday(): Observable<Match[]> {
    return this.http.get<ListResponse<Match>>(`${this.base}/today`).pipe(map((r) => r.data));
  }

  /** GET /matches?date=YYYY-MM-DD  (solo ayer, hoy o mañana) */
  getByDate(date: string): Observable<Match[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ListResponse<Match>>(this.base, { params }).pipe(map((r) => r.data));
  }

  /** GET /matches/live */
  getLive(): Observable<Match[]> {
    return this.http.get<ListResponse<Match>>(`${this.base}/live`).pipe(map((r) => r.data));
  }

  /** GET /matches/competition/:id  (partidos de hoy de esa competición) */
  getByCompetition(competitionId: number, date?: string): Observable<Match[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http
      .get<ListResponse<Match>>(`${this.base}/competition/${competitionId}`, { params })
      .pipe(map((r) => r.data));
  }

  /** GET /matches/:id/detail  (incluye goles, tarjetas, cambios) */
  getDetail(id: string): Observable<Match> {
    return this.http.get<ItemResponse<Match>>(`${this.base}/${id}/detail`).pipe(map((r) => r.data));
  }

  /** GET /matches/all  (todo lo guardado en MongoDB) */
  getAll(): Observable<Match[]> {
    return this.http.get<ListResponse<Match>>(`${this.base}/all`).pipe(map((r) => r.data));
  }

  /** PUT /matches/:id  (corregir resultado / estado) */
  update(id: string, body: MatchUpdate): Observable<Match> {
    return this.http.put<ItemResponse<Match>>(`${this.base}/${id}`, body).pipe(map((r) => r.data));
  }

  /** DELETE /matches/:id */
  remove(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.base}/${id}`);
  }
}
