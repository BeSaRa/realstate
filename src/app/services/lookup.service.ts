import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LookupsContract } from '@contracts/lookups-contract';
import { RegisterServiceMixin } from '@mixins/register-service-mixin';
import { Lookup } from '@models/lookup';
import { LookupsMap } from '@models/lookups-map';
import { UrlService } from '@services/url.service';
import { CastResponse } from 'cast-response';
import { forkJoin, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LookupService extends RegisterServiceMixin(class {}) {
  serviceName = 'LookupService';
  urlService = inject(UrlService);
  http = inject(HttpClient);

  rentLookups!: LookupsContract;
  sellLookups!: LookupsContract;

  rentMunicipalitiesMap: Record<number, Lookup> = {};
  sellMunicipalitiesMap: Record<number, Lookup> = {};

  rentZonesMap: Record<number, Lookup> = {};
  sellZonesMap: Record<number, Lookup> = {};

  rentRoomsMap: Record<number, Lookup> = {};

  rentPurposeMap: Record<number, Lookup> = {};
  sellPurposeMap: Record<number, Lookup> = {};

  @CastResponse(() => LookupsMap, {
    shape: {
      'propertyTypeList.*': () => Lookup,
      'rentPurposeList.*': () => Lookup,
      'zoneList.*': () => Lookup,
      'municipalityList.*': () => Lookup,
    },
  })
  _loadRentLookups(): Observable<LookupsMap> {
    return this.http.get<LookupsMap>(this.urlService.URLS.RENT_LOOKUPS);
  }

  @CastResponse(() => LookupsMap, {
    shape: {
      'propertyTypeList.*': () => Lookup,
      'rentPurposeList.*': () => Lookup,
      'zoneList.*': () => Lookup,
      'municipalityList.*': () => Lookup,
    },
  })
  _loadSellLookups(): Observable<LookupsMap> {
    return this.http.get<LookupsMap>(this.urlService.URLS.SELL_LOOKUPS);
  }

  private _load(): Observable<LookupsMap[]> {
    return forkJoin([this._loadRentLookups(), this._loadSellLookups()]);
  }

  load(): Observable<LookupsMap[]> {
    return this._load()
      .pipe(
        map(([rent, sell]) => {
          rent.zoneList = rent.zoneList.filter((i) => i.lookupKey !== -1); // remove the all from zones
          sell.zoneList = sell.zoneList.filter((i) => i.lookupKey !== -1); // remove the all from zones
          return [rent, sell];
        }),
        tap(([rent, sell]) => {
          this.rentLookups = rent;
          this.sellLookups = this._addAllToSellPropertyType(sell);
        })
      )
      .pipe(
        tap((res) => {
          this.rentMunicipalitiesMap = this._initializeMunicipalitiesMap(res[0]);
          this.sellMunicipalitiesMap = this._initializeMunicipalitiesMap(res[1]);
        }),
        tap((res) => {
          this.rentZonesMap = this._initializeZonesMap(res[0]);
          this.sellZonesMap = this._initializeZonesMap(res[1]);
        }),
        tap((res) => {
          this.rentPurposeMap = this._initializePurposeMap(res[0]);
          this.sellPurposeMap = this._initializePurposeMap(res[1]);
        })
      );
  }

  private _initializeZonesMap(lookups: LookupsMap) {
    return lookups.zoneList.reduce((acc, i) => {
      return { ...acc, [i.lookupKey]: i };
    }, {});
  }

  private _initializeMunicipalitiesMap(lookups: LookupsMap) {
    return lookups.municipalityList.reduce((acc, i) => {
      return { ...acc, [i.lookupKey]: i };
    }, {});
  }

  private _initializePurposeMap(lookups: LookupsMap) {
    return lookups.rentPurposeList.reduce((acc, i) => {
      return { ...acc, [i.lookupKey]: i };
    }, {});
  }

  // Temporarily used until back team add all from backend
  private _addAllToSellPropertyType(lookups: LookupsContract) {
    if (lookups.propertyTypeList.find((p) => p.lookupKey === -1)) return lookups;
    lookups.propertyTypeList = [
      new Lookup().clone<Lookup>({
        arName: 'الكل',
        enName: 'All',
        lookupKey: -1,
      }),
      ...lookups.propertyTypeList,
    ];
    return lookups;
  }
}
