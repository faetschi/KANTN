import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {providePrimeNG} from 'primeng/config';
import Aura from '@primeng/themes/aura';

import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode'
        }
      }
    })
  ],
};
