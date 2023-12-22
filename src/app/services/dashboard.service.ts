import { KpiBaseDurationModel } from '@abstracts/kpi-base-duration-model';
import { KpiBaseModel } from '@abstracts/kpi-base-model';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ChartWithOppositePopupComponent } from '@components/chart-with-opposite-popup/chart-with-opposite-popup.component';
import { ChartWithOppositePopupData } from '@contracts/chart-with-opposite-popup-data';
import { CriteriaContract } from '@contracts/criteria-contract';
import { DurationDataContract } from '@contracts/duration-data-contract';
import { ForecastCriteriaContract } from '@contracts/forecast-criteria-contract';
import { RentCriteriaContract } from '@contracts/rent-criteria-contract';
import { SellCriteriaContract } from '@contracts/sell-criteria-contract';
import { ServiceContract } from '@contracts/service-contract';
import { DurationEndpoints } from '@enums/durations';
import { RegisterServiceMixin } from '@mixins/register-service-mixin';
import { Broker } from '@models/broker';
import {
  CompositeTransaction,
  RentCompositeTransaction,
  SellCompositeTransaction,
} from '@models/composite-transaction';
import { ForecastData } from '@models/forecast-data';
import { KpiBase } from '@models/kpi-base';
import { KpiRoot } from '@models/kpi-root';
import { Lookup } from '@models/lookup';
import { MortgageTransaction } from '@models/mortgage-transaction';
import { OccupancyTransaction } from '@models/occupancy-transaction';
import { OwnershipTransaction } from '@models/ownership-transaction';
import { Pagination } from '@models/pagination';
import { RentTransaction } from '@models/rent-transaction';
import { RentTransactionStatistics } from '@models/rent-transaction-statistics';
import { SellTransaction } from '@models/sell-transaction';
import { SellTransactionStatistic } from '@models/sell-transaction-statistic';
import { Top10KpiModel } from '@models/top-10-kpi-model';
import { UrlService } from '@services/url.service';
import { groupBy, minMaxAvg, range } from '@utils/utils';
import { CastResponse } from 'cast-response';
import { map, Observable } from 'rxjs';
import { DialogService } from './dialog.service';
import { TranslationService } from './translation.service';
import { LookupService } from './lookup.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService extends RegisterServiceMixin(class {}) implements ServiceContract {
  serviceName = 'DashboardService';
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private lookupService = inject(LookupService);
  private lang = inject(TranslationService);
  private dialog = inject(DialogService);

  loadKpiRoot(kpi: KpiRoot, criteria: CriteriaContract): Observable<KpiBaseModel[]> {
    return this.http
      .post<KpiBaseModel[]>(kpi.url, criteria)
      .pipe(map((data) => data.map((item) => KpiBase.kpiFactory(kpi.hasSqUnit).clone(item))));
  }

  loadPurposeKpi(kpi: KpiRoot, criteria: Partial<CriteriaContract>) {
    return this.http
      .post<(KpiBaseModel & { purposeId: number })[]>(kpi.purposeUrl, criteria)
      .pipe(map((data) => data.map((item) => KpiBase.kpiFactory(kpi.hasSqUnit).clone(item))));
  }

  loadPropertyTypeKpi(kpi: KpiRoot, criteria: Partial<CriteriaContract>) {
    return this.http
      .post<(KpiBaseModel & { propertyTypeId: number })[]>(kpi.propertyTypeUrl, criteria)
      .pipe(map((data) => data.map((item) => KpiBase.kpiFactory(kpi.hasSqUnit).clone(item))));
  }

  loadChartKpiData(
    chartData: { chartDataUrl: string; hasSqUnit?: boolean },
    criteria: Partial<CriteriaContract>
  ): Observable<KpiBaseModel[]> {
    return this.http
      .post<KpiBaseModel[]>(chartData.chartDataUrl, criteria)
      .pipe(map((data) => data.map((item) => KpiBase.kpiFactory(chartData.hasSqUnit as boolean).clone(item))));
  }

  loadChartKpiDataForDuration(
    endPoint: DurationEndpoints,
    chartData: { chartDataUrl: string; hasSqUnit?: boolean },
    criteria: Partial<CriteriaContract>
  ): Observable<KpiBaseDurationModel[]> {
    return this.http
      .post<KpiBaseDurationModel[]>(chartData.chartDataUrl + '/' + endPoint, criteria)
      .pipe(map((data) => data.map((item) => KpiBase.kpiDurationFactory(chartData.hasSqUnit as boolean).clone(item))));
  }

  @CastResponse(() => Top10KpiModel)
  loadTop10ChartData(chartData: { chartDataUrl: string; hasSqUnit?: boolean }, criteria: Partial<CriteriaContract>) {
    return this.http.post<Top10KpiModel[]>(chartData.chartDataUrl, criteria);
  }

  @CastResponse(() => SellTransactionStatistic)
  loadSellTransactionsStatistics(criteria: Partial<SellCriteriaContract>, type: 'purpose' | 'propertyType') {
    return this.http.post<SellTransactionStatistic[]>(
      type === 'purpose' ? this.urlService.URLS.SELL_KPI25 : this.urlService.URLS.SELL_KPI27,
      criteria
    );
  }

  @CastResponse(() => RentTransactionStatistics)
  loadRentTransactionsStatistics(criteria: Partial<RentCriteriaContract>, type: 'purpose' | 'propertyType') {
    return this.http.post<RentTransactionStatistics[]>(
      type === 'purpose' ? this.urlService.URLS.RENT_KPI25 : this.urlService.URLS.RENT_KPI27,
      criteria
    );
  }

  @CastResponse(() => Pagination<RentTransaction>, { shape: { 'transactionList.*': () => RentTransaction } })
  loadRentKpiTransactions(criteria: Partial<CriteriaContract>): Observable<Pagination<RentTransaction[]>> {
    return this.http.post<Pagination<RentTransaction[]>>(this.urlService.URLS.RENT_KPI29, criteria);
  }

  @CastResponse(() => Pagination<SellTransaction>, { shape: { 'transactionList.*': () => SellTransaction } })
  loadSellKpiTransactions(criteria: Partial<CriteriaContract>): Observable<Pagination<SellTransaction[]>> {
    return this.http.post<Pagination<SellTransaction[]>>(this.urlService.URLS.SELL_KPI29, criteria);
  }

  @CastResponse(() => Pagination<MortgageTransaction>, { shape: { 'transactionList.*': () => MortgageTransaction } })
  loadMortgageKpiTransactions(criteria: Partial<CriteriaContract>): Observable<Pagination<MortgageTransaction[]>> {
    return this.http.post<Pagination<MortgageTransaction[]>>(this.urlService.URLS.MORT_KPI7, criteria);
  }

  @CastResponse(() => Pagination<OwnershipTransaction>, { shape: { 'transactionList.*': () => OwnershipTransaction } })
  loadOwnershipsTransactions(criteria: Partial<CriteriaContract>): Observable<Pagination<OwnershipTransaction[]>> {
    return this.http.post<Pagination<OwnershipTransaction[]>>(this.urlService.URLS.OWNER_KPI22, criteria);
  }

  @CastResponse(() => Pagination<OccupancyTransaction>, { shape: { 'transactionList.*': () => OccupancyTransaction } })
  loadOccupancyTransactions(criteria: Partial<CriteriaContract>): Observable<Pagination<OccupancyTransaction[]>> {
    return this.http.post<Pagination<OccupancyTransaction[]>>(this.urlService.URLS.OV_KPI7, criteria);
  }

  @CastResponse(() => Pagination<Broker>, { shape: { 'transactionList.*': () => Broker } })
  loadBrokers(criteria: Partial<CriteriaContract>): Observable<Pagination<Broker[]>> {
    return this.http.post<Pagination<Broker[]>>(this.urlService.URLS.BROKER_KPI_TRANSACTIONS, criteria);
  }

  loadForecastData(url: string, criteria: Partial<ForecastCriteriaContract>) {
    return this.http.post<ForecastData[]>(url, criteria).pipe(map((data) => data[0]));
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
          // instead of chunk each two consecutive items, we should group by municipalityId
          // since may one municipality has no transaction in current or previous year
          // as fetched data shows
          return Object.values(groupBy(values, (x: CompositeTransaction) => x.municipalityId));
          // return [...chunks(values, 2)];
        })
      )
      .pipe(
        map((values) => {
          // get the distinct years values instead of using first item, since
          // it may have only one transaction
          const years = [...new Set(values.flat().map((x) => x.issueYear))].sort();

          // if some item has only one transaction fill another one with
          // appropriate values i.e., zeros for kpi values and 100 or -100 to YoY values
          values.forEach((item) => {
            if (item.length == 2) return;
            else if (item.length == 1) {
              const secondCompositeTransaction =
                item[0].issueYear == years[0]
                  ? new SellCompositeTransaction(
                      years[1],
                      item[0].municipalityId,
                      item[0].municipalityInfo,
                      -100,
                      -100,
                      -100
                    )
                  : new SellCompositeTransaction(
                      years[0],
                      item[0].municipalityId,
                      item[0].municipalityInfo,
                      100,
                      100,
                      100
                    );
              item.push(secondCompositeTransaction);
            }
          });
          return {
            years: {
              previousYear: years[1] ? years[0] : years[0] - 1, //values[0][0].issueYear,
              selectedYear: years[1] ? years[1] : years[0], //values[0][1].issueYear,
            },
            items: values,
          };
        })
      );
  }

  openRentStatsChartDialog(
    criteria: Partial<RentCriteriaContract>,
    item: RentTransactionStatistics,
    type: 'purpose' | 'propertyType'
  ) {
    const _criteria = { ...criteria };
    type === 'purpose'
      ? (_criteria.purposeList = [item.purposeId])
      : (_criteria.propertyTypeList = [item.propertyTypeId]);
    return this.http
      .post<RentTransactionStatistics[]>(
        type === 'purpose' ? this.urlService.URLS.RENT_KPI26 : this.urlService.URLS.RENT_KPI26,
        _criteria
      )
      .pipe(
        map((data) =>
          this.dialog.open<ChartWithOppositePopupComponent, ChartWithOppositePopupData<RentTransactionStatistics>>(
            ChartWithOppositePopupComponent,
            {
              data: {
                title:
                  type === 'purpose'
                    ? this.lookupService.rentPurposeMap[data[0].purposeId]?.getNames()
                    : this.lookupService.rentPropertyTypeMap[data[0].propertyTypeId]?.getNames(),
                list: data,
                mainChart: { title: this.lang.map.average_price_per_month, bindValue: 'rentPaymentMonthly' },
                oppositeChart: { title: this.lang.map.rent_contracts_count, bindValue: 'certificateCount' },
              },
              maxWidth: '95vw',
            }
          )
        )
      );
  }

  openSellStatsChartDialog(
    criteria: Partial<SellCriteriaContract>,
    item: SellTransactionStatistic,
    type: 'purpose' | 'propertyType'
  ) {
    const _criteria = { ...criteria };
    type === 'purpose'
      ? (_criteria.purposeList = [item.purposeId])
      : (_criteria.propertyTypeList = [item.propertyTypeId]);
    return this.http
      .post<SellTransactionStatistic[]>(
        type === 'purpose' ? this.urlService.URLS.SELL_KPI26 : this.urlService.URLS.SELL_KPI26,
        _criteria
      )
      .pipe(
        map((data) =>
          this.dialog.open<ChartWithOppositePopupComponent, ChartWithOppositePopupData<SellTransactionStatistic>>(
            ChartWithOppositePopupComponent,
            {
              data: {
                title:
                  type === 'purpose'
                    ? this.lookupService.sellPurposeMap[data[0].purposeId]?.getNames()
                    : this.lookupService.sellPropertyTypeMap[data[0].propertyTypeId]?.getNames(),
                list: data,
                mainChart: { title: this.lang.map.average_sell_price_per_unit_property, bindValue: 'medianPrice' },
                oppositeChart: { title: this.lang.map.number_of_sell_contracts, bindValue: 'countCertificateCode' },
              },
              maxWidth: '95vw',
            }
          )
        )
      );
  }

  mapDurationData(data: KpiBaseDurationModel[], durations: Lookup[]): DurationDataContract {
    const durationData: DurationDataContract = {};

    const { min: minYear, max: maxYear } = minMaxAvg(data?.map((item) => item.issueYear));
    const yearRange = range(minYear, maxYear);

    durations.forEach((item) => {
      durationData[item.lookupKey] = { period: item, kpiValues: [] };
    });

    data?.forEach((item) => {
      durationData[item.issuePeriod].kpiValues.push(item);
    });

    yearRange.forEach((year) => {
      durations.forEach((item) => {
        durationData[item.lookupKey].kpiValues.find((d) => d.issueYear === year) ??
          durationData[item.lookupKey].kpiValues.push({ issueYear: year, getKpiVal: () => 0 } as KpiBaseDurationModel);
      });
    });

    durations.forEach((item) => {
      durationData[item.lookupKey].kpiValues.sort((a, b) => a.issueYear - b.issueYear);
    });

    return durationData;
  }
}
