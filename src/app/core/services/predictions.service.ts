import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemResponse, ListResponse, Prediction, PredictionDetail } from '../models/models';
import { AuthService } from './auth.service';


@Injectable({ providedIn: 'root' })
export class PredictionsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.apiUrl}/users/predictions`;

 
  predictionFor(matchId: string): Prediction | undefined {
    return this.auth.user()?.predictions?.find((p) => String(p.matchId) === matchId);
  }

 
  save(matchId: string, homeScore: number, awayScore: number): Observable<Prediction[]> {
    return this.http
      .post<ItemResponse<Prediction[]>>(this.base, { matchId, homeScore, awayScore })
      .pipe(
        map((r) => r.data),
        tap((predictions) => {
          const u = this.auth.user();
          if (u) this.auth.setUser({ ...u, predictions });
        }),
      );
  }

 
  list(): Observable<PredictionDetail[]> {
    return this.http.get<ListResponse<PredictionDetail>>(this.base).pipe(map((r) => r.data));
  }
}
