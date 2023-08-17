import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BidiModule } from '@angular/cdk/bidi';
import { ExtraHeaderComponent } from '@components/extra-header/extra-header.component';
import { FormControl, ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ChartOptions } from '@app-types/ChartOptions';
import { TranslationService } from '@services/translation.service';
import { TransactionsFilterComponent } from '@components/transactions-filter/transactions-filter.component';
import { CriteriaContract } from '@contracts/criteria-contract';
import { CriteriaType } from '@enums/criteria-type';
import { LookupService } from '@services/lookup.service';
import { KpiRootComponent } from '@components/kpi-root/kpi-root.component';
import { KpiRoot } from '@models/kpiRoot';
import { UrlService } from '@services/url.service';
import { DashboardService } from '@services/dashboard.service';
import { KpiModel } from '@models/kpi-model';
import { TransactionType } from '@enums/transaction-type';
import { ChartType } from '@enums/chart-type';
import { IconButtonComponent } from '@components/icon-button/icon-button.component';

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
  ],
  templateUrl: './mortgage-indicators.component.html',
  styleUrls: ['./mortgage-indicators.component.scss'],
})
export default class MortgageIndicatorsComponent implements OnInit {
  lang = inject(TranslationService);
  lookupService = inject(LookupService);
  urlService = inject(UrlService);
  dashboardService = inject(DashboardService);

  criteria: { criteria: CriteriaContract; type: CriteriaType } = {} as {
    criteria: CriteriaContract;
    type: CriteriaType;
  };

  control = new FormControl('', { nonNullable: true });
  fb = inject(UntypedFormBuilder);

  @ViewChild('chart', { static: true }) transactionCountChart!: ChartComponent;

  municipalities = this.lookupService.mortLookups.municipalityList;
  propertyUsage = this.lookupService.mortLookups.rentPurposeList.slice().sort((a, b) => a.lookupKey - b.lookupKey);
  propertyTypes = this.lookupService.mortLookups.propertyTypeList;
  rooms = [] /*this.lookupService.mortLookups.rooms*/;
  areas = this.lookupService.mortLookups.districtList;

  rootKpis = [
    new KpiRoot(
      1,
      this.lang.getArabicTranslation('total_mortgage_transactions'),
      this.lang.getEnglishTranslation('total_mortgage_transactions'),
      false,
      this.urlService.URLS.MORT_KPI1,
      '',
      '',
      this.urlService.URLS.MORT_KPI2,
      'assets/icons/kpi/1.png'
    ),
    new KpiRoot(
      3,
      this.lang.getArabicTranslation('the_total_number_of_mortgaged_units'),
      this.lang.getEnglishTranslation('the_total_number_of_mortgaged_units'),
      false,
      this.urlService.URLS.MORT_KPI3,
      '',
      '',
      this.urlService.URLS.MORT_KPI4,
      'assets/icons/kpi/2.png'
    ),
    new KpiRoot(
      5,
      this.lang.getArabicTranslation('total_value_of_mortgage_transactions'),
      this.lang.getEnglishTranslation('total_value_of_mortgage_transactions'),
      true,
      this.urlService.URLS.MORT_KPI5,
      '',
      '',
      this.urlService.URLS.MORT_KPI6,
      'assets/icons/kpi/6.png'
    ),
  ];

  selectedRootKpi: KpiRoot = this.rootKpis[0];

  lineChartData?: Record<number, KpiModel[]>;
  selectedChartType: ChartType = ChartType.LINE;

  protected readonly ChartType = ChartType;

  // total_mortgage_transactions
  chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      height: 350,
      type: ChartType.LINE,
    },
    colors: ['#0081ff', '#ff0000'],
    dataLabels: {
      enabled: true,
    },
    legend: {
      fontFamily: 'inherit',
    },
    stroke: {
      show: true,
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: [],
    },
    tooltip: {
      theme: 'light',
      shared: true,
    },
    plotOptions: {
      bar: {
        columnWidth: '30%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    yaxis: {
      title: {
        text: this.lang.map.number_of_transactions,
      },
    },
  };

  ngOnInit() {}

  filterChange($event: { criteria: CriteriaContract; type: CriteriaType }): void {
    this.criteria = $event;
    this.dashboardService.loadMortgageRoots(this.criteria.criteria).subscribe((values) => {
      this.rootKpis.map((item, index) => {
        item.value = (values[index] && values[index].kpiVal) || 0;
        item.yoy = (values[index] && values[index].kpiYoYVal) || 0;
      });

      if (this.selectedRootKpi) {
        this.rootItemSelected(this.selectedRootKpi);
      }
    });
  }

  rootItemSelected(item: KpiRoot): void {
    this.dashboardService.loadMortgageTransactionCountChart(item, this.criteria.criteria).subscribe((value) => {
      this.lineChartData = value;
      this.updateTransactionCountChart();
    });
  }

  updateTransactionCountChart(): void {
    if (!this.lineChartData) return;

    const xaxis = Object.keys(this.lineChartData);
    const mort = xaxis.reduce((acc, year) => {
      // console.log(this.lineChartData[year]);
      return [...acc].concat(
        (this.lineChartData &&
          this.lineChartData[Number(year)].filter((item) => item.actionType === TransactionType.MORTGAGE)) ||
          []
      );
    }, [] as KpiModel[]);
    const sell = xaxis.reduce((acc, year) => {
      // console.log(this.lineChartData[year]);
      return [...acc].concat(
        (this.lineChartData &&
          this.lineChartData[Number(year)].filter((item) => item.actionType === TransactionType.SELL)) ||
          []
      );
    }, [] as KpiModel[]);

    this.transactionCountChart
      .updateOptions({
        series: [
          {
            name: this.lang.map.mortgage,
            data: mort.map((i) => i.kpiVal),
          },
          {
            name: this.lang.map.sell,
            data: sell.map((i) => i.kpiVal),
          },
        ],
        xaxis: {
          categories: xaxis,
        },
      })
      .then();
  }

  updateChartType(type: ChartType) {
    this.transactionCountChart
      .updateOptions({
        chart: { type: type, stacked: type === ChartType.BAR },
        stroke: { show: type !== ChartType.BAR },
      })
      .then();
    this.selectedChartType = type;
  }

  isSelectedChartType(type: ChartType) {
    return this.selectedChartType === type;
  }
}
