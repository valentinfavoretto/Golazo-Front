// Competiciones habilitadas en el backend (src/utils/leagueWhitelist.ts).
// Si en el backend cambia la whitelist, hay que actualizar esta lista.

export interface League {
  id: number;
  name: string;
  country: string;
  flag: string; // emoji
}

export const LEAGUES: League[] = [
  { id: 128, name: 'Liga Profesional Argentina', country: 'Argentina',  flag: '🇦🇷' },
  { id: 1,   name: 'Mundial 2026',               country: 'Mundo',      flag: '🌎' },
  { id: 39,  name: 'Premier League',             country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga',                    country: 'España',     flag: '🇪🇸' },
  { id: 135, name: 'Serie A',                    country: 'Italia',     flag: '🇮🇹' },
  { id: 78,  name: 'Bundesliga',                 country: 'Alemania',   flag: '🇩🇪' },
  { id: 61,  name: 'Ligue 1',                    country: 'Francia',    flag: '🇫🇷' },
  { id: 71,  name: 'Brasileirão Série A',        country: 'Brasil',     flag: '🇧🇷' },
];

export function getLeague(id: number): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

export function leagueOrder(id: number): number {
  const i = LEAGUES.findIndex((l) => l.id === id);
  return i === -1 ? 999 : i;
}

/** Logo oficial de la liga (CDN público de API-Football). */
export function leagueLogo(id: number): string {
  return `https://media.api-sports.io/football/leagues/${id}.png`;
}
