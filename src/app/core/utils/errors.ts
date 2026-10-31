import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const msg = (err.error as { message?: string } | null)?.message;
    if (msg) return msg;
    if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
      return 'No se pudo conectar con el servidor. ¿Está corriendo el backend (puerto 3000)?';
    }
    if (err.status === 401) return 'No autorizado. Iniciá sesión nuevamente.';
    if (err.status === 429) return 'Demasiados intentos. Esperá unos minutos.';
  }
  return 'Ocurrió un error inesperado';
}
