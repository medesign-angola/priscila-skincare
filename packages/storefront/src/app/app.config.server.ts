import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { TranslateLoader, type TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

export class TranslateServerLoader implements TranslateLoader {
  constructor(
    private prefix = 'public/assets/i18n/',
    private suffix = '.json',
  ) {}

  public getTranslation(lang: string): Observable<TranslationObject> {
    try {
      // Tenta caminhos diferentes para desenvolvimento (prerender) e produção
      let filePath = path.join(
        process.cwd(),
        'packages/storefront',
        this.prefix,
        `${lang}${this.suffix}`,
      );
      if (!fs.existsSync(filePath)) {
        filePath = path.join(
          process.cwd(),
          'browser/assets/i18n',
          `${lang}${this.suffix}`,
        );
      }
      if (!fs.existsSync(filePath)) {
        filePath = path.join(
          __dirname,
          '../browser/assets/i18n',
          `${lang}${this.suffix}`,
        );
      }

      const fileData = fs.readFileSync(filePath, 'utf8');
      return of(JSON.parse(fileData) as TranslationObject);
    } catch (e) {
      console.error('Erro ao carregar arquivos de tradução no servidor:', e);
      return of({});
    }
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: TranslateLoader,
      useClass: TranslateServerLoader,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
