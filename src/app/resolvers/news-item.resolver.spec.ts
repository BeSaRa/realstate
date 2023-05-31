import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { newsItemResolver } from './news-item.resolver';

describe('newsItemResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => newsItemResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
