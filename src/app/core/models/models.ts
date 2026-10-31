// ─────────────────────────────────────────────────────────────────────────────
// Modelos (interfaces TypeScript) que reflejan lo que devuelve el backend.
// ─────────────────────────────────────────────────────────────────────────────

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
export type UserRole = 'viewer' | 'admin';

export interface MatchEvent {
  time: number;
  team: string;
  player: string;
  type: string;   // 'Goal' | 'Card' | 'subst' | 'Var'
  detail: string; // 'Normal Goal', 'Yellow Card', ...
}

/** Partido guardado en MongoDB (tiene _id). */
export interface Match {
  _id: string;
  externalId: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHT: number | null;
  awayScoreHT: number | null;
  date: string; // ISO
  competition: string;
  competitionId: number;
  competitionLogo: string;
  country: string;
  countryCode: string;
  status: MatchStatus;
  statusShort: string;
  elapsed: number | null;
  venue: string;
  referee: string;
  events: MatchEvent[];
  round: string;
}

/** Partido del fixture de una liga: viene directo de API-Football, sin _id. */
export type Fixture = Omit<Match, '_id'>;

/** Lo mínimo que necesita la fila de partido para dibujarse. */
export interface MatchRowData {
  _id?: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  status: MatchStatus;
  statusShort?: string;
  elapsed?: number | null;
}

export interface FavoriteTeam {
  teamId: number;
  teamName: string;
  logo: string;
}

/** Partido favorito "populado" (lo devuelve GET /users/me). */
export interface FavoriteMatch extends MatchRowData {
  _id: string;
  competition: string;
}

export interface Prediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  // En /me vienen como objetos (populate); en el resto de respuestas, como ids.
  favoriteMatches: Array<string | FavoriteMatch>;
  favoriteTeams: FavoriteTeam[];
  predictions: Prediction[];
  createdAt: string;
  updatedAt: string;
}

export type PredictionResult = 'pending' | 'correct' | 'incorrect';

export interface PredictionDetail {
  matchId: string;
  myPrediction: { homeScore: number; awayScore: number };
  actualResult: { homeScore: number | null; awayScore: number | null } | null;
  result: PredictionResult;
  match: (MatchRowData & { _id: string; competition: string }) | null;
  createdAt: string;
}

export interface StandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  form: string | null;
  description: string | null;
}

export interface TeamSearchResult {
  id: number;
  name: string;
  logo: string;
  country: string;
  founded: number | null;
  venue: string | null;
  city: string | null;
}

// ── Respuestas genéricas del backend ─────────────────────────────────────────
export interface ListResponse<T> {
  ok: boolean;
  count: number;
  data: T[];
}
export interface ItemResponse<T> {
  ok: boolean;
  message?: string;
  data: T;
}
export interface AuthResponse {
  ok: boolean;
  token: string;
  user: User;
}
export interface MessageResponse {
  ok: boolean;
  message: string;
}
