import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListResponse, TeamSearchResult } from '../models/models';


@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly http = inject(HttpClient);

  
  search(name: string): Observable<TeamSearchResult[]> {
    const params = new HttpParams().set('name', name);
    return this.http
      .get<ListResponse<TeamSearchResult>>(`${environment.apiUrl}/teams/search`, { params })
      .pipe(map((r) => r.data));
  }
}
