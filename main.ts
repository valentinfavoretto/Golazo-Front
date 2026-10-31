import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Fechas en español (pipe "date": "lunes 26 de octubre", etc.)
registerLocaleData(localeEsAr);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
