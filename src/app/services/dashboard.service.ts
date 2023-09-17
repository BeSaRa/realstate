import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ChartWithOppositePopupComponent } from '@components/chart-with-opposite-popup/chart-with-opposite-popup.component';
import { ChartWithOppositePopupData } from '@contracts/chart-with-opposite-popup-data';
import { CriteriaContract } from '@contracts/criteria-contract';
import { DurationDataContract } from '@contracts/duration-data-contract';
import { MortgageCriteriaContract } from '@contracts/mortgage-criteria-contract';
import { OwnerCriteriaContract } from '@contracts/owner-criteria-contract';
import { RentCriteriaContract } from '@contracts/rent-criteria-contract';
import { SellCriteriaContract } from '@contracts/sell-criteria-contract';
import { ServiceContract } from '@contracts/service-contract';
import { DurationEndpoints } from '@enums/durations';
import { NationalityCategories } from '@enums/nationality-categories';
import { RegisterServiceMixin } from '@mixins/register-service-mixin';
import {
  CompositeTransaction,
  RentCompositeTransaction,
  SellCompositeTransaction,
} from '@models/composite-transaction';
import { FurnitureStatusKpi } from '@models/furniture-status-kpi';
import { KpiDurationModel } from '@models/kpi-duration-model';
import { KpiModel } from '@models/kpi-model';
import { KpiRoot } from '@models/kpiRoot';
import { Lookup } from '@models/lookup';
import { OwnershipCountNationality } from '@models/ownership-count-nationality';
import { RentDefaultValues } from '@models/rent-default-values';
import { RentTop10Model } from '@models/rent-top-10-model';
import { RentTransaction } from '@models/rent-transaction';
import { RentTransactionPurpose } from '@models/rent-transaction-purpose';
import { RoomNumberKpi } from '@models/room-number-kpi';
import { SellDefaultValues } from '@models/sell-default-values';
import { SellTop10Model } from '@models/sell-top-10-model';
import { SellTransaction } from '@models/sell-transaction';
import { SellTransactionPurpose } from '@models/sell-transaction-purpose';
import { UrlService } from '@services/url.service';
import { chunks, minMaxAvg, range } from '@utils/utils';
import { CastResponse } from 'cast-response';
import { forkJoin, map, Observable } from 'rxjs';
import { DialogService } from './dialog.service';
import { TranslationService } from './translation.service';
import { MortgageTransaction } from '@models/mortgage-transaction';

@Injectable({
  providedIn: 'root',
})
export class DashboardService extends RegisterServiceMixin(class {}) implements ServiceContract {
  serviceName = 'DashboardService';
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private lang = inject(TranslationService);
  private dialog = inject(DialogService);

  @CastResponse(() => RentDefaultValues)
  loadRentDefaults(criteria: Partial<RentCriteriaContract>): Observable<RentDefaultValues[]> {
    return this.http.post<RentDefaultValues[]>(this.urlService.URLS.DEFAULT_RENT, criteria);
  }

  @CastResponse(() => SellDefaultValues)
  loadSellDefaults(criteria: Partial<SellCriteriaContract>): Observable<SellDefaultValues[]> {
    return this.http.post<SellDefaultValues[]>(this.urlService.URLS.DEFAULT_SELL, criteria);
  }

  loadMortgageRoots(criteria: Partial<MortgageCriteriaContract>): Observable<KpiModel[]> {
    return forkJoin([
      this.http.post<KpiModel[]>(this.urlService.URLS.MORT_KPI1, criteria),
      this.http.post<KpiModel[]>(this.urlService.URLS.MORT_KPI3, criteria),
      this.http.post<KpiModel[]>(this.urlService.URLS.MORT_KPI5, criteria),
    ]).pipe(
      map(([first, second, third]) => {
        return [first[0], second[0], third[0]];
      })
    );
  }

  loadKpiRoot(kpi: KpiRoot, criteria: CriteriaContract): Observable<KpiModel[]> {
    return this.http.post<KpiModel[]>(kpi.url, criteria);
  }

  loadPurposeKpi(kpi: KpiRoot, criteria: Partial<CriteriaContract>): Observable<KpiModel[]> {
    return this.http.post<KpiModel[]>(kpi.subUrl!, criteria);
  }

  loadPropertyTypeKpi(kpi: KpiRoot, criteria: Partial<CriteriaContract>): Observable<KpiModel[]> {
    return this.http.post<KpiModel[]>(kpi.secondSubUrl!, criteria);
  }

  loadChartKpiData(chartData: { chartDataUrl?: string }, criteria: Partial<CriteriaContract>): Observable<KpiModel[]> {
    // forkJoin([
    //   this.loadLineChartKpiForDuration(DurationEndpoints.HALFY, kpi, criteria),
    //   this.loadLineChartKpiForDuration(DurationEndpoints.RENT_QUARTERLY, kpi, criteria),
    //   this.loadLineChartKpiForDuration(DurationEndpoints.MONTHLY, kpi, criteria),
    // ]).subscribe(console.log);
    return this.http.post<KpiModel[]>(chartData.chartDataUrl!, criteria);
  }

  loadChartKpiDataForDuration(
    endPoint: DurationEndpoints,
    chartData: { chartDataUrl?: string },
    criteria: Partial<CriteriaContract>
  ): Observable<KpiDurationModel[]> {
    return this.http.post<KpiDurationModel[]>(chartData.chartDataUrl! + '/' + endPoint, criteria);
  }

  @CastResponse(() => RentTransactionPurpose)
  loadRentTransactionsBasedOnPurpose(criteria: Partial<RentCriteriaContract>): Observable<RentTransactionPurpose[]> {
    return this.http.post<RentTransactionPurpose[]>(this.urlService.URLS.RENT_KPI25, criteria);
  }

  @CastResponse(() => SellTransactionPurpose)
  loadSellTransactionsBasedOnPurpose(criteria: Partial<SellCriteriaContract>): Observable<SellTransactionPurpose[]> {
    return this.http.post<SellTransactionPurpose[]>(this.urlService.URLS.SELL_KPI25, criteria);
  }

  @CastResponse(() => RentTransactionPurpose)
  loadRentTransactionsBasedOnPurposeDetails(
    criteria: Partial<RentCriteriaContract>
  ): Observable<RentTransactionPurpose[]> {
    return this.http.post<RentTransactionPurpose[]>(this.urlService.URLS.RENT_KPI26, criteria);
  }

  @CastResponse(() => SellTransactionPurpose)
  loadSellTransactionsBasedOnPurposeDetails(
    criteria: Partial<SellCriteriaContract>
  ): Observable<SellTransactionPurpose[]> {
    return this.http.post<SellTransactionPurpose[]>(this.urlService.URLS.SELL_KPI26, criteria);
  }

  @CastResponse(() => RentTransaction)
  loadRentKpiTransactions(criteria: Partial<CriteriaContract>): Observable<RentTransaction[]> {
    return this.http.post<RentTransaction[]>(this.urlService.URLS.RENT_KPI29, criteria);
  }

  @CastResponse(() => SellTransaction)
  loadSellKpiTransactions(criteria: Partial<CriteriaContract>): Observable<SellTransaction[]> {
    return this.http.post<SellTransaction[]>(this.urlService.URLS.SELL_KPI29, criteria);
  }

  @CastResponse(() => MortgageTransaction)
  loadMortgageKpiTransactions(criteria: Partial<CriteriaContract>): Observable<MortgageTransaction[]> {
    return this.http.post<MortgageTransaction[]>(this.urlService.URLS.MORT_KPI7, criteria);
  }

  @CastResponse(() => RentTop10Model)
  loadRentTop10BasedOnCriteria(item: Lookup, criteria: Partial<RentCriteriaContract>): Observable<RentTop10Model[]> {
    return this.http.post<RentTop10Model[]>(item.url, criteria);
  }

  @CastResponse(() => SellTop10Model)
  loadSellTop10BasedOnCriteria(item: Lookup, criteria: Partial<RentCriteriaContract>): Observable<SellTop10Model[]> {
    return this.http.post<SellTop10Model[]>(item.url, criteria);
  }

  @CastResponse(() => CompositeTransaction)
  private _loadCompositeTransactions(
    url: string,
    criteria: Partial<CriteriaContract>
  ): Observable<CompositeTransaction[]> {
    return this.http.post<CompositeTransaction[]>(url, criteria);
  }

  @CastResponse(() => SellCompositeTransaction)
  _loadSellCompositeTransactions(criteria: Partial<SellCriteriaContract>) {
    return this.http.post<SellCompositeTransaction[]>(this.urlService.URLS.SELL_KPI35_36_37, criteria);
  }

  @CastResponse(() => RentCompositeTransaction)
  _loadRentCompositeTransactions(criteria: Partial<RentCriteriaContract>) {
    return this.http.post<RentCompositeTransaction[]>(this.urlService.URLS.RENT_KPI35_36_37, criteria);
  }

  loadSellCompositeTransactions(criteria: Partial<SellCriteriaContract>) {
    return this.mapCompositeTransactions(this._loadSellCompositeTransactions(criteria));
  }

  loadRentCompositeTransactions(criteria: Partial<RentCriteriaContract>) {
    return this.mapCompositeTransactions(this._loadRentCompositeTransactions(criteria));
  }

  private mapCompositeTransactions(compositeTransactions: Observable<CompositeTransaction[]>): Observable<{
    years: { selectedYear: number; previousYear: number };
    items: CompositeTransaction[][];
  }> {
    return compositeTransactions
      .pipe(
        map((values) => {
          return values;
        }),
        map((values) => {
          return [...chunks(values, 2)];
        })
      )
      .pipe(
        map((values) => {
          return {
            years: {
              previousYear: values[0][0].issueYear,
              selectedYear: values[0][1].issueYear,
            },
            items: values,
          };
        })
      );
  }

  @CastResponse(() => RoomNumberKpi)
  loadRentRoomCounts(criteria: Partial<RentCriteriaContract>): Observable<RoomNumberKpi[]> {
    return this.http.post<RoomNumberKpi[]>(this.urlService.URLS.RENT_KPI34, criteria);
  }

  @CastResponse(() => RoomNumberKpi)
  loadSellRoomCounts(criteria: Partial<SellCriteriaContract>): Observable<RoomNumberKpi[]> {
    return this.http.post<RoomNumberKpi[]>(this.urlService.URLS.SELL_KPI34, criteria);
  }

  @CastResponse(() => FurnitureStatusKpi)
  loadRentFurnitureStatus(criteria: Partial<RentCriteriaContract>): Observable<FurnitureStatusKpi[]> {
    return this.http.post<FurnitureStatusKpi[]>(this.urlService.URLS.RENT_KPI34_1, criteria);
  }

  openRentChartDialogBasedOnPurpose(
    criteria: Partial<RentCriteriaContract>
  ): Observable<MatDialogRef<ChartWithOppositePopupComponent>> {
    return this.loadRentTransactionsBasedOnPurposeDetails(criteria).pipe(
      map((data) =>
        this.dialog.open<ChartWithOppositePopupComponent, ChartWithOppositePopupData<RentTransactionPurpose>>(
          ChartWithOppositePopupComponent,
          {
            data: {
              title: data[0].purposeInfo.getNames(),
              list: data,
              mainChart: { title: this.lang.map.average_price_per_month, bindValue: 'rentPaymentMonthly' },
              oppositeChart: { title: this.lang.map.rent_contracts_count, bindValue: 'certificateCount' },
            },
          }
        )
      )
    );
  }

  openSellChartDialogBasedOnPurpose(
    criteria: Partial<SellCriteriaContract>
  ): Observable<MatDialogRef<ChartWithOppositePopupComponent>> {
    return this.loadSellTransactionsBasedOnPurposeDetails(criteria).pipe(
      map((data) =>
        this.dialog.open<ChartWithOppositePopupComponent, ChartWithOppositePopupData<SellTransactionPurpose>>(
          ChartWithOppositePopupComponent,
          {
            data: {
              title: data[0].purposeInfo.getNames(),
              list: data,
              mainChart: { title: this.lang.map.average_price, bindValue: 'medianPrice' },
              oppositeChart: { title: this.lang.map.number_of_sell_contracts, bindValue: 'countCertificateCode' },
            },
          }
        )
      )
    );
  }

  loadMortgageTransactionCountChart(
    criteria: Partial<MortgageCriteriaContract>,
    duration: DurationEndpoints = DurationEndpoints.YEARLY
  ): Observable<Record<number, KpiModel[]>> {
    return this.http
      .post<KpiModel[]>(this.getSelectedDurationString(this.urlService.URLS.MORT_KPI2, duration), criteria)
      .pipe(
        map((values) => {
          return values.reduce((acc, item) => {
            if (!Object.prototype.hasOwnProperty.call(acc, item.issueYear)) {
              acc[item.issueYear] = [];
            }
            acc[item.issueYear].push(item);
            return { ...acc };
          }, {} as Record<number, KpiModel[]>);
        })
      );
  }

  loadMortgageTransactionValueChart(
    criteria: Partial<MortgageCriteriaContract>,
    duration: DurationEndpoints = DurationEndpoints.YEARLY
  ): Observable<Record<number, KpiModel[]>> {
    return this.http
      .post<KpiModel[]>(this.getSelectedDurationString(this.urlService.URLS.MORT_KPI6, duration), criteria)
      .pipe(
        map((values) => {
          return values.reduce((acc, item) => {
            if (!Object.prototype.hasOwnProperty.call(acc, item.issueYear)) {
              acc[item.issueYear] = [];
            }
            acc[item.issueYear].push(item);
            return { ...acc };
          }, {} as Record<number, KpiModel[]>);
        })
      );
  }

  @CastResponse(() => OwnershipCountNationality)
  loadOwnershipsCountNationality(
    criteria: Partial<OwnerCriteriaContract>,
    nationalityCategory: NationalityCategories
  ): Observable<OwnershipCountNationality[]> {
    return this.http.post<OwnershipCountNationality[]>(
      this.getOwnershipCountNationalityEndpoint(nationalityCategory),
      criteria
    );
  }

  private getSelectedDurationString(url: string, duration: DurationEndpoints): string {
    return (
      url +
      (duration === DurationEndpoints.YEARLY
        ? ''
        : duration === DurationEndpoints.HALFY
        ? '/halfly'
        : duration === DurationEndpoints.QUARTERLY
        ? '/quartley'
        : duration === DurationEndpoints.MONTHLY
        ? '/monthly'
        : '')
    );
  }

  mapDurationData(data: KpiDurationModel[], durations: Lookup[]): DurationDataContract {
    const durationData: DurationDataContract = {};

    const { min: minYear, max: maxYear } = minMaxAvg(data.map((item) => item.issueYear));
    const yearRange = range(minYear, maxYear);

    durations.forEach((item) => {
      durationData[item.lookupKey] = { period: item, kpiValues: [] };
    });

    data.forEach((item) => {
      durationData[item.issuePeriod].kpiValues.push({ year: item.issueYear, value: item.kpiVal });
    });

    yearRange.forEach((year) => {
      durations.forEach((item) => {
        durationData[item.lookupKey].kpiValues.find((d) => d.year === year) ??
          durationData[item.lookupKey].kpiValues.push({ year, value: 0 });
      });
    });

    durations.forEach((item) => {
      durationData[item.lookupKey].kpiValues.sort((a, b) => a.year - b.year);
    });

    return durationData;
  }

  private getOwnershipCountNationalityEndpoint(nationalityCategory: NationalityCategories) {
    return nationalityCategory === NationalityCategories.QATARI
      ? this.urlService.URLS.OWNER_KPI11
      : nationalityCategory === NationalityCategories.GCC
      ? this.urlService.URLS.OWNER_KPI11_1
      : this.urlService.URLS.OWNER_KPI11_2;
  }
}
