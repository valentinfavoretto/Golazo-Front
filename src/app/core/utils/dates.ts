
export function utcDateString(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().split('T')[0];
}


export function shortDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const txt = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(d);
  return txt.replace('.', '');
}


export function roundLabel(round: string): string {
  if (!round) return '';
  const map: Record<string, string> = {
    'Final': 'Final',
    'Semi-finals': 'Semifinales',
    'Quarter-finals': 'Cuartos de final',
    'Round of 16': 'Octavos de final',
    'Round of 32': '16avos de final',
    '8th Finals': 'Octavos de final',
    '16th Finals': '16avos de final',
    '3rd Place Final': 'Tercer puesto',
  };
  if (map[round]) return map[round];
  return round
    .replace('Regular Season - ', 'Fecha ')
    .replace('Group Stage - ', 'Fase de grupos · Fecha ')
    .replace('Apertura - ', 'Apertura · Fecha ')
    .replace('Clausura - ', 'Clausura · Fecha ');
}
