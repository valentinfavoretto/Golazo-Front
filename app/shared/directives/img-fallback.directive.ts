import { Directive } from '@angular/core';

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1d4a2f" stroke="#3b7a52" stroke-width="1.5"/><path d="M12 7l3 2.2-1.1 3.5h-3.8L9 9.2z" fill="#3b7a52"/></svg>',
  );

/**
 * Directiva de atributo: si un logo no carga (sin internet, URL rota, etc.)
 * lo reemplaza por un escudo genérico.
 *
 * Uso:  <img appImgFallback [src]="partido.homeLogo">
 */
@Directive({
  selector: 'img[appImgFallback]',
  host: { '(error)': 'onError($event)' },
})
export class ImgFallbackDirective {
  onError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== PLACEHOLDER) {
      img.src = PLACEHOLDER;
    }
  }
}
