import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { MatchRowData } from '../../core/models/models';

/**
 * Pipe personalizado: convierte el estado de un partido en el texto
 * que se muestra a la izquierda de la fila ("Final", "67'", "21:30", ...).
 *
 * Uso en plantilla:  {{ partido | matchStatus }}   o   {{ partido | matchStatus:true }}
 */
@Pipe({ name: 'matchStatus' })
export class MatchStatusPipe implements PipeTransform {
  transform(m: MatchRowData, withDate = false): string {
    switch (m.status) {
      case 'live':
        if (m.statusShort === 'HT') return 'Ent.';
        return m.elapsed != null ? `${m.elapsed}'` : 'En vivo';
      case 'finished':
        if (m.statusShort === 'AET') return 'Final (TS)';
        if (m.statusShort === 'PEN') return 'Final (Pen)';
        return 'Final';
      case 'postponed':
        return 'Postergado';
      case 'cancelled':
        return 'Suspendido';
      default:
        // 'scheduled': hora local del navegador
        return formatDate(m.date, withDate ? 'dd/MM HH:mm' : 'HH:mm', 'en-US');
    }
  }
}
