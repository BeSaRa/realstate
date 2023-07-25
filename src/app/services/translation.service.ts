import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, OnInit } from '@angular/core';
import { LangContract } from '@contracts/lang-contract';
import { LangKeysContract } from '@contracts/lang-keys-contract';
import { ServiceContract } from '@contracts/service-contract';
import { TranslationAddContract, TranslationContract } from '@contracts/translation-contract';
import { LangChangeProcess } from '@enums/lang-change-process';
import { LangCodes } from '@enums/lang-codes';
import { RegisterServiceMixin } from '@mixins/register-service-mixin';
import { UrlService } from '@services/url.service';
import { distinctUntilChanged, map, Observable, of, Subject, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslationService extends RegisterServiceMixin(class {}) implements ServiceContract {
  serviceName = 'TranslationService';

  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private document = inject(DOCUMENT);

  private arabic: Record<keyof LangKeysContract, string> = {} as Record<keyof LangKeysContract, string>;
  private english: Record<keyof LangKeysContract, string> = {} as Record<keyof LangKeysContract, string>;
  map: Record<keyof LangKeysContract, string> = {} as Record<keyof LangKeysContract, string>;
  toggleMap: Record<keyof LangKeysContract, string> = {} as Record<keyof LangKeysContract, string>;

  languages: LangContract[] = [
    {
      id: 1,
      code: LangCodes.AR,
      name: 'العربية',
      direction: 'rtl',
      toggleTo: LangCodes.EN,
    },
    {
      id: 2,
      code: LangCodes.EN,
      name: 'English',
      direction: 'ltr',
      toggleTo: LangCodes.AR,
    },
  ];
  private langMap: Record<LangCodes, LangContract> = this.languages.reduce((acc, item) => {
    return { ...acc, [item.code]: item };
  }, {} as Record<LangCodes, LangContract>);

  private current: LangContract = this.languages[0];
  isLtr = this.current.direction === 'ltr';

  private change = new BehaviorSubject<LangContract>(this.current);
  private langChangerNotifier: Subject<LangChangeProcess> = new Subject<LangChangeProcess>();

  change$ = this.change.asObservable();
  langChangeProcess$ = this.langChangerNotifier.asObservable().pipe(distinctUntilChanged());

  constructor() {
    super();
    this.setDirection(this.current.direction);
  }

  add(translations: TranslationAddContract[]) {
    return this.http
      .post<{ data: TranslationContract[] }>(this.urlService.URLS.TRANSLATION, translations)
      .pipe(map((res) => res.data))
      .pipe(tap(this.prepareTranslations));
  }

  load(): Observable<TranslationContract[]> {
    return this.http
      .get<{ data: TranslationContract[] }>(this.urlService.URLS.TRANSLATION, {
        params: new HttpParams({ fromObject: { limit: 1000 } }),
      })
      .pipe(
        map((res) => res.data),
        tap(this.prepareTranslations)
      );
  }

  toggleLang(): void {
    this.setCurrent(this.langMap[this.current.toggleTo]);
  }

  prepareTranslations = (translations: TranslationContract[]) => {
    translations.forEach((translation) => {
      const key = translation.key as keyof LangKeysContract;
      if (translation.language.includes('ar')) {
        this.arabic[key] = translation.value;
      } else {
        this.english[key] = translation.value;
      }
    });
    this.setCurrentLanguageMap();
  };

  setCurrentLanguageMap(): void {
    this.map = this.current.code === LangCodes.AR ? this.arabic : this.english;
    this.toggleMap = this.current.code === LangCodes.AR ? this.english : this.arabic;
  }

  setCurrent(lang: LangContract): void {
    of(LangChangeProcess.START)
      .pipe(tap(() => this.langChangerNotifier.next(LangChangeProcess.PREPARE)))
      .pipe(map(() => (this.current = lang)))
      .pipe(tap(() => (this.isLtr = this.current.direction === 'ltr')))
      .pipe(tap(() => this.setCurrentLanguageMap()))
      .subscribe(() => {
        this.change.next(this.current);
        this.setDirection(this.current.direction);
        this.langChangerNotifier.next(LangChangeProcess.END);
      });
  }

  getCurrent() {
    return this.current;
  }

  private setDirection(direction: 'rtl' | 'ltr'): void {
    const html = this.document.querySelector('html');
    if (!html) return;
    html.dir = direction;
  }
}