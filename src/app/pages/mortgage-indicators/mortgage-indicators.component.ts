import { BidiModule } from '@angular/cdk/bidi';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DateAdapter, MatOptionModule } from '@angular/material/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ButtonComponent } from '@components/button/button.component';
import { DurationChartComponent } from '@components/duration-chart/duration-chart.component';
import { ExtraHeaderComponent } from '@components/extra-header/extra-header.component';
import { IconButtonComponent } from '@components/icon-button/icon-button.component';
import { KpiRootComponent } from '@components/kpi-root/kpi-root.component';
import { TableComponent } from '@components/table/table.component';
import { TransactionsFilterComponent } from '@components/transactions-filter/transactions-filter.component';
import { AppColors } from '@constants/app-colors';
import { CriteriaContract } from '@contracts/criteria-contract';
import { TableColumnCellTemplateDirective } from '@directives/table-column-cell-template.directive';
import { TableColumnHeaderTemplateDirective } from '@directives/table-column-header-template.directive';
import { TableColumnTemplateDirective } from '@directives/table-column-template.directive';
import { BarChartTypes } from '@enums/bar-chart-type';
import { Breakpoints } from '@enums/breakpoints';
import { ChartType } from '@enums/chart-type';
import { CriteriaType } from '@enums/criteria-type';
import { DurationEndpoints } from '@enums/durations';
import { TransactionType } from '@enums/transaction-type';
import { AppTableDataSource } from '@models/app-table-data-source';
import { ChartOptionsModel } from '@models/chart-options-model';
import { KpiDurationModel } from '@models/kpi-duration-model';
import { KpiModel } from '@models/kpi-model';
import { KpiRoot } from '@models/kpiRoot';
import { MortgageTransaction } from '@models/mortgage-transaction';
import { TableSortOption } from '@models/table-sort-option';
import { AppChartTypesService } from '@services/app-chart-types.service';
import { DashboardService } from '@services/dashboard.service';
import { LookupService } from '@services/lookup.service';
import { ScreenBreakpointsService } from '@services/screen-breakpoints.service';
import { TranslationService } from '@services/translation.service';
import { UnitsService } from '@services/units.service';
import { UrlService } from '@services/url.service';
import { minMaxAvg } from '@utils/utils';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import {
  BehaviorSubject,
  delay,
  map,
  Observable,
  of,
  combineLatest,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
  take,
} from 'rxjs';

@Component({
  selector: 'app-mortgage-indicators',
  standalone: true,
  imports: [
    CommonModule,
    BidiModule,
    ExtraHeaderComponent,
    MatAutocompleteModule,
    MatOptionModule,
    NgApexchartsModule,
    ReactiveFormsModule,
    TransactionsFilterComponent,
    KpiRootComponent,
    IconButtonComponent,
    ButtonComponent,
    TableComponent,
    TableColumnTemplateDirective,
    TableColumnHeaderTemplateDirective,
    TableColumnCellTemplateDirective,
    MatTableModule,
    DurationChartComponent,
  ],
  templateUrl: './mortgage-indicators.component.html',
  styleUrls: ['./mortgage-indicators.component.scss'],
})
export default class MortgageIndicatorsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('countChart') countChart!: QueryList<ChartComponent>;

  lang = inject(TranslationService);
  lookupService = inject(LookupService);
  urlService = inject(UrlService);
  dashboardService = inject(DashboardService);
  appChartTypesService = inject(AppChartTypesService);
  unitsService = inject(UnitsService);
  adapter = inject(DateAdapter);
  screenService = inject(ScreenBreakpointsService);

  screenSize = Breakpoints.LG;

  destroy$ = new Subject<void>();
  reload$ = new ReplaySubject<void>(1);
  private paginate$ = new BehaviorSubject({
    offset: 0,
    limit: 5,
  });

  municipalities = this.lookupService.mortLookups.municipalityList;
  areas = this.lookupService.mortLookups.districtList;
  propertyUsage = this.lookupService.mortLookups.rentPurposeList.slice().sort((a, b) => a.lookupKey - b.lookupKey);
  propertyTypes = this.lookupService.mortLookups.propertyTypeList;
  paramsRange = this.lookupService.mortLookups.maxParams;

  criteria: { criteria: CriteriaContract; type: CriteriaType } = {} as {
    criteria: CriteriaContract;
    type: CriteriaType;
  };

  criteriaSubject = new BehaviorSubject<CriteriaContract | undefined>(undefined);
  criteria$ = this.criteriaSubject.asObservable();

  protected readonly DurationTypes = DurationEndpoints;
  protected readonly ChartType = ChartType;

  rootKpis = [
    new KpiRoot(
      1,
      this.lang.getArabicTranslation('total_mortgage_transactions'),
      this.lang.getEnglishTranslation('total_mortgage_transactions'),
      false,
      this.urlService.URLS.MORT_KPI1,
      '',
      '',
      '',
      'assets/icons/kpi/svg/mort/1.svg'
    ),
    new KpiRoot(
      3,
      this.lang.getArabicTranslation('the_total_number_of_mortgaged_units'),
      this.lang.getEnglishTranslation('the_total_number_of_mortgaged_units'),
      false,
      this.urlService.URLS.MORT_KPI3,
      '',
      '',
      '',
      'assets/icons/kpi/svg/mort/2.svg'
    ),
    new KpiRoot(
      5,
      this.lang.getArabicTranslation('total_value_of_mortgage_transactions'),
      this.lang.getEnglishTranslation('total_value_of_mortgage_transactions'),
      true,
      this.urlService.URLS.MORT_KPI5,
      '',
      '',
      '',
      'assets/icons/kpi/svg/mort/3.svg'
    ),
  ];

  unitsRootData$ = new BehaviorSubject({
    chartDataUrl: this.urlService.URLS.MORT_KPI4,
    hasPrice: false,
  }).asObservable();

  valueRootData$ = new BehaviorSubject({
    chartDataUrl: this.urlService.URLS.MORT_KPI6,
    hasPrice: true,
  }).asObservable();

  selectedCountChartDurationType = DurationEndpoints.YEARLY;
  selectedCountChartType: ChartType = ChartType.LINE;
  countChartDataLength = 0;
  selectedCountBarChartType = BarChartTypes.SINGLE_BAR;

  countChartOptions = new ChartOptionsModel().clone<ChartOptionsModel>({
    ...this.appChartTypesService.mainChartOptions,
  });

  yearlyOrMonthlyChartOptions = new ChartOptionsModel().clone<ChartOptionsModel>({
    ...this.appChartTypesService.mainChartOptions,
  });

  halfyCountChartOptions = new ChartOptionsModel().clone<ChartOptionsModel>({
    ...this.appChartTypesService.mainChartOptions,
    series: [
      { group: '0', data: [] },
      { group: '1', data: [] },
      { group: '0', data: [] },
      { group: '1', data: [] },
    ],
  });

  quarterlyCountChartOptions = new ChartOptionsModel().clone<ChartOptionsModel>({
    ...this.appChartTypesService.mainChartOptions,
    series: [
      { group: '0', data: [] },
      { group: '1', data: [] },
      { group: '2', data: [] },
      { group: '3', data: [] },
      { group: '0', data: [] },
      { group: '1', data: [] },
      { group: '2', data: [] },
      { group: '3', data: [] },
    ],
  });

  transactions$: Observable<MortgageTransaction[]> = this.loadTransactions();
  dataSource: AppTableDataSource<MortgageTransaction> = new AppTableDataSource(this.transactions$);
  transactionsCount = 0;
  transactionsSortOptions: TableSortOption[] = [
    new TableSortOption().clone<TableSortOption>({
      arName: this.lang.getArabicTranslation('most_recent'),
      enName: this.lang.getEnglishTranslation('most_recent'),
      value: {
        column: 'issueDate',
        direction: 'desc',
      },
    }),
    new TableSortOption().clone<TableSortOption>({
      arName: this.lang.getArabicTranslation('oldest'),
      enName: this.lang.getEnglishTranslation('oldest'),
      value: {
        column: 'issueDate',
        direction: 'asc',
      },
    }),
    new TableSortOption().clone<TableSortOption>({
      arName: this.lang.getArabicTranslation('the_higher_price'),
      enName: this.lang.getEnglishTranslation('the_higher_price'),
      value: {
        column: 'realEstateValue',
        direction: 'desc',
      },
    }),
    new TableSortOption().clone<TableSortOption>({
      arName: this.lang.getArabicTranslation('the_lowest_price'),
      enName: this.lang.getEnglishTranslation('the_lowest_price'),
      value: {
        column: 'realEstateValue',
        direction: 'asc',
      },
    }),
    new TableSortOption().clone<TableSortOption>({
      arName: this.lang.getArabicTranslation('highest_price_per_square_foot'),
      enName: this.lang.getEnglishTranslation('highest_price_per_square_foot'),
      value: {
        column: 'priceMT',
        direction: 'desc',
      },
    }),
    new TableSortOption().clone<TableSortOption>({
      arName: this.lang.getArabicTranslation('lowest_price_per_square_foot'),
      enName: this.lang.getEnglishTranslation('lowest_price_per_square_foot'),
      value: {
        column: 'priceMT',
        direction: 'asc',
      },
    }),
  ];

  ngOnInit() {
    this.reload$.next();
  }

  ngAfterViewInit(): void {
    this._initializeChartsFormatters();
    setTimeout(() => {
      this._listenToScreenSize();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }

  filterChange($event: { criteria: CriteriaContract; type: CriteriaType }): void {
    this.criteria = $event;
    this.criteriaSubject.next($event.criteria);
    this.dashboardService
      .loadMortgageRoots(this.criteria.criteria)
      .pipe(take(1))
      .subscribe((values) => {
        this.rootKpis.map((item, index) => {
          item.value = (values[index] && values[index].kpiVal) || 0;
          item.yoy = (values[index] && values[index].kpiYoYVal) || 0;
        });
        // this.loadTransactions();
        this.reload$.next();

        this.updateCountChartData(this.selectedCountChartDurationType);
      });
  }

  updateCountChartData(durationType: DurationEndpoints) {
    if (!this.countChart.length) return;
    this.selectedCountChartDurationType = durationType;

    if (this.selectedCountChartDurationType === DurationEndpoints.YEARLY) {
      this.updateCountChartDataYearly();
      this.selectedCountBarChartType = BarChartTypes.SINGLE_BAR;
      this.countChartOptions = this.yearlyOrMonthlyChartOptions;
    } else if (this.selectedCountChartDurationType === DurationEndpoints.MONTHLY) {
      this.updateCountChartDataMonthly();
      this.selectedCountBarChartType = BarChartTypes.SINGLE_BAR;
      this.countChartOptions = this.yearlyOrMonthlyChartOptions;
    } else if (this.selectedCountChartDurationType === DurationEndpoints.HALFY) {
      this.updateCountChartDataHalfyOrQuarterly();
      this.selectedCountBarChartType = BarChartTypes.DOUBLE_BAR;
      this.countChartOptions = this.halfyCountChartOptions;
    } else {
      this.updateCountChartDataHalfyOrQuarterly();
      this.selectedCountBarChartType = BarChartTypes.QUAD_BAR;
      this.countChartOptions = this.quarterlyCountChartOptions;
    }
  }

  updateCountChartDataYearly() {
    this.dashboardService
      .loadChartKpiData<KpiModel>({ chartDataUrl: this.urlService.URLS.MORT_KPI2 }, this.criteria.criteria)
      .pipe(take(1))
      .subscribe((data) => {
        const _data = this._splitAccordingToActionType(data);
        this.countChartDataLength = _data[TransactionType.MORTGAGE].length;
        this.updateCountChartType(ChartType.BAR);

        this.countChart.first
          .updateOptions({
            chart: {
              stacked: true,
            },
            series: [
              {
                name: this.lang.map.mortgage,
                group: '0',
                data: _data[TransactionType.MORTGAGE].map((i) => ({ y: i.kpiVal, x: i.issueYear })),
              },
              {
                name: this.lang.map.sell,
                group: '0',
                data: _data[TransactionType.SELL].map((i) => ({ y: i.kpiVal, x: i.issueYear })),
              },
            ],
            colors: [AppColors.PRIMARY, AppColors.SECONDARY],
            ...this.appChartTypesService.yearlyStaticChartOptions,
            ...this.appChartTypesService.getRangeOptions(
              this.screenSize,
              this.selectedCountBarChartType,
              this.countChartDataLength,
              true
            ),
          })
          .then();
      });
  }

  updateCountChartDataMonthly() {
    this.adapter.setLocale(this.lang.getCurrent().code === 'ar-SA' ? 'ar-EG' : 'en-US');
    const months = this.adapter.getMonthNames('long');
    this.dashboardService
      .loadChartKpiDataForDuration(
        DurationEndpoints.MONTHLY,
        { chartDataUrl: this.urlService.URLS.MORT_KPI2 },
        this.criteria.criteria
      )
      .pipe(take(1))
      .subscribe((data) => {
        data.sort((a, b) => a.issuePeriod - b.issuePeriod);
        this.updateCountChartType(ChartType.BAR);

        const _data = this._splitAccordingToActionType(data as unknown as KpiModel[]) as unknown as Record<
          number,
          KpiDurationModel[]
        >;
        this.countChartDataLength = _data[TransactionType.MORTGAGE].length;

        this.countChart.first
          .updateOptions({
            chart: {
              stacked: true,
            },
            series: [
              {
                name: this.lang.map.mortgage,
                data: _data[TransactionType.MORTGAGE].map((i) => ({ y: i.kpiVal, x: months[i.issuePeriod - 1] })),
              },
              {
                name: this.lang.map.sell,
                data: _data[TransactionType.SELL].map((i) => ({ y: i.kpiVal, x: months[i.issuePeriod - 1] })),
              },
            ],
            colors: [AppColors.PRIMARY, AppColors.SECONDARY],
            ...this.appChartTypesService.monthlyStaticChartOptions,
            ...this.appChartTypesService.getRangeOptions(
              this.screenSize,
              this.selectedCountBarChartType,
              this.countChartDataLength,
              true
            ),
          })
          .then();
      });
  }

  updateCountChartDataHalfyOrQuarterly() {
    this.dashboardService
      .loadChartKpiDataForDuration(
        this.selectedCountChartDurationType === DurationEndpoints.HALFY
          ? DurationEndpoints.HALFY
          : DurationEndpoints.QUARTERLY,
        { chartDataUrl: this.urlService.URLS.MORT_KPI2 },
        this.criteria.criteria
      )
      .pipe(take(1))
      .pipe(
        map(
          (data) =>
            this._splitAccordingToActionType(data as unknown as KpiModel[]) as unknown as Record<
              number,
              KpiDurationModel[]
            >
        ),
        map((data) => {
          return {
            [TransactionType.SELL]: this.dashboardService.mapDurationData(
              data[TransactionType.SELL],
              this.selectedCountChartDurationType === DurationEndpoints.HALFY
                ? this.lookupService.ownerLookups.halfYearDurations
                : this.lookupService.ownerLookups.quarterYearDurations
            ),
            [TransactionType.MORTGAGE]: this.dashboardService.mapDurationData(
              data[TransactionType.MORTGAGE],
              this.selectedCountChartDurationType === DurationEndpoints.HALFY
                ? this.lookupService.ownerLookups.halfYearDurations
                : this.lookupService.ownerLookups.quarterYearDurations
            ),
          };
        })
      )
      .subscribe((data) => {
        const _chartData = [
          ...Object.keys(data[TransactionType.MORTGAGE]).map((key, index) => ({
            name:
              this.lang.map.mortgage +
              ': ' +
              data[TransactionType.MORTGAGE][key as unknown as number].period.getNames(),
            group: index.toString(),
            data: data[TransactionType.MORTGAGE][key as unknown as number].kpiValues.map((item) => ({
              y: item.kpiVal,
              x: item.issueYear,
            })),
          })),
          ...Object.keys(data[TransactionType.SELL]).map((key, index) => ({
            name: this.lang.map.sell + ': ' + data[TransactionType.SELL][key as unknown as number].period.getNames(),
            group: index.toString(),
            data: data[TransactionType.SELL][key as unknown as number].kpiValues.map((item) => ({
              y: item.kpiVal,
              x: item.issueYear,
            })),
          })),
        ];
        this.countChartDataLength = data[TransactionType.MORTGAGE][1].kpiValues.length;

        this.updateCountChartType(ChartType.BAR);
        this.countChart.first
          .updateOptions({
            chart: {
              stacked: true,
            },
            series: _chartData,
            ...this.appChartTypesService.halflyAndQuarterlyStaticChartOptions,
            ...this.appChartTypesService.getRangeOptions(
              this.screenSize,
              this.selectedCountBarChartType,
              this.countChartDataLength,
              true
            ),
          })
          .then();
      });
  }

  updateCountChartType(type: ChartType) {
    this.countChart.first.updateOptions({ chart: { type: type } }).then();
    this.selectedCountChartType = type;
  }

  private _splitAccordingToActionType(data: KpiModel[]) {
    return data.reduce(
      (acc, cur) => {
        if (cur.actionType === TransactionType.SELL) acc[TransactionType.SELL].push(cur);
        else acc[TransactionType.MORTGAGE].push(cur);
        return acc;
      },
      { [TransactionType.SELL]: [] as KpiModel[], [TransactionType.MORTGAGE]: [] as KpiModel[] }
    );
  }

  paginate($event: PageEvent) {
    this.paginate$.next({
      offset: $event.pageSize * $event.pageIndex,
      limit: $event.pageSize,
    });
  }

  protected loadTransactions(): Observable<MortgageTransaction[]> {
    return of(undefined)
      .pipe(delay(0))
      .pipe(
        switchMap(() => {
          return combineLatest([this.reload$, this.paginate$]).pipe(
            switchMap(([, paginationOptions]) => {
              this.criteria.criteria.limit = paginationOptions.limit;
              this.criteria.criteria.offset = paginationOptions.offset;
              return this.dashboardService.loadMortgageKpiTransactions(this.criteria.criteria);
            }),
            map(({ count, transactionList }) => {
              this.transactionsCount = count;
              return transactionList;
            })
          );
        })
      );
  }

  private _initializeChartsFormatters() {
    [
      this.countChartOptions,
      this.yearlyOrMonthlyChartOptions,
      this.halfyCountChartOptions,
      this.quarterlyCountChartOptions,
    ].forEach((chart, index) =>
      chart
        .addDataLabelsFormatter((val, opts) =>
          this.appChartTypesService.dataLabelsFormatter({ val, opts }, { hasPrice: index === 5 ? true : false })
        )
        .addAxisYFormatter((val, opts) =>
          this.appChartTypesService.axisYFormatter({ val, opts }, { hasPrice: index === 5 ? true : false })
        )
        .addCustomToolbarOptions()
    );
  }

  private _listenToScreenSize() {
    this.screenService.screenSizeObserver$
      .pipe(takeUntil(this.destroy$))
      .pipe(takeUntil(this.destroy$))
      .subscribe((size) => {
        this.screenSize = size;
        this.countChart.first.updateOptions(
          this.appChartTypesService.getRangeOptions(
            size,
            this.selectedCountBarChartType,
            this.countChartDataLength,
            true
          )
        );
      });
  }
}
