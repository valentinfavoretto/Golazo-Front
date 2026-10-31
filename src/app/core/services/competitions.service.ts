import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Fixture, StandingRow } from '../models/models';

export interface StandingsResponse {
  ok: boolean;
  league: number;
  season: number;
  count: number;
  data: StandingRow[];
}

export interface FixturesResponse {
  ok: boolean;
  league: number;
  season: number;
  count: number;
  data: Fixture[];
}


@Injectable({ providedIn: 'root' })
export class CompetitionsService {
  private readonly http = inject(HttpClient);

 
  getStandings(leagueId: number, season?: number): Observable<StandingsResponse> {
    let params = new HttpParams().set('league', leagueId);
    if (season) params = params.set('season', season);
    return this.http.get<StandingsResponse>(`${environment.apiUrl}/standings`, { params });
  }

  
  getFixtures(leagueId: number, season?: number): Observable<FixturesResponse> {
    let params = new HttpParams();
    if (season) params = params.set('season', season);
    return this.http.get<FixturesResponse>(`${environment.apiUrl}/competitions/${leagueId}/fixtures`, {
      params,
    });
  }
}
