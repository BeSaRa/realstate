import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { CriteriaContract } from '@contracts/criteria-contract';
import { DashboardService } from '@services/dashboard.service';
import { AppChartTypesService } from '@services/app-chart-types.service';
import { ScreenBreakpointsService } from '@services/screen-breakpoints.service';
import { Breakpoints } from '@enums/breakpoints';
import { KpiBaseModel } from '@abstracts/kpi-base-model';
import { ChartConfig, ChartContext, ChartOptionsModel, DataPointSelectionConfig } from '@models/chart-options-model';
import { map, take, takeUntil } from 'rxjs';
import { OnDestroyMixin } from '@mixins/on-destroy-mixin';
import { BarChartTypes } from '@enums/bar-chart-type';
import { minMaxAvg, objectHasOwnProperty } from '@utils/utils';

@Component({
  selector: 'app-nationalities-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './nationalities-chart.component.html',
  styleUrls: ['./nationalities-chart.component.scss'],
})
export class NationalitiesChartComponent extends OnDestroyMixin(class {}) implements OnChanges, AfterViewInit {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) name!: string;
  @Input({ required: true }) criteria!: CriteriaContract;
  @Input({ required: true }) rootData!: { chartDataUrl: string; hasPrice: boolean };
  @Input({ required: true }) bindLabel!: string | ((item: any) => string);

  @Output() selectedNationalityChanged = new EventEmitter<{ nationalityCode: number }>();

  @ViewChildren('chart') chart!: QueryList<ChartComponent>;

  dashboardService = inject(DashboardService);
  appChartTypesService = inject(AppChartTypesService);
  screenService = inject(ScreenBreakpointsService);
  cdr = inject(ChangeDetectorRef);

  screenSize = Breakpoints.LG;

  isChartFirstUpdate = true;
  isUpdatingChartData = false;
  seriesData: (KpiBaseModel & { nationalityCode: number })[] = [];
  seriesDataLength = 0;
  selectedNationality = { id: 634, seriesIndex: 0, dataPointIndex: 0 };

  chartOptions = new ChartOptionsModel().clone<ChartOptionsModel>(this.appChartTypesService.mainChartOptions);

  isLoading = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['rootData'] && changes['rootData'].currentValue !== changes['rootData'].previousValue) ||
      (changes['criteria'] && changes['criteria'].currentValue !== changes['criteria'].previousValue)
    ) {
      setTimeout(() => {
        this.updateChartData();
      }, 0);
    }
  }

  ngAfterViewInit(): void {
    this._initializeFormatters();
    setTimeout(() => {
      this.chart.first?.updateOptions({ chart: { type: 'bar' } }).then();
      this._listenToScreenSizeChange();
    }, 0);
  }

  updateChartData() {
    this.isUpdatingChartData = true;
    const _criteria = { ...this.criteria };
    (_criteria as any).nationalityCode = -1;

    this.dashboardService
      .loadChartKpiData({ chartDataUrl: this.rootData.chartDataUrl }, this.criteria)
      .pipe(take(1))
      .pipe(map((data) => data as (KpiBaseModel & { nationalityId: number })[]))
      .subscribe((data) => {
        const _minMaxAvg = minMaxAvg(data.map((item) => item.getKpiVal()));
        this.seriesDataLength = data.length;
        data.sort((a, b) => a.getKpiVal() - b.getKpiVal());
        this.chart.first
          ?.updateOptions({
            series: [
              {
                name: this.name,
                data: data.map((item, index) => ({
                  x: this._getLabel(item),
                  y: item.getKpiVal(),
                  id: item.nationalityId,
                  index,
                })),
              },
            ],
            colors: [this.appChartTypesService.chartColorsFormatter(_minMaxAvg)],
            ...this.appChartTypesService.getRangeOptions(
              this.screenSize,
              BarChartTypes.SINGLE_BAR,
              this.seriesDataLength
            ),
          })
          .then();
      });
  }

  private _getLabel(item: unknown): string {
    return this.bindLabel && typeof this.bindLabel === 'string'
      ? typeof (item as never)[this.bindLabel] === 'function'
        ? ((item as never)[this.bindLabel] as () => string)()
        : objectHasOwnProperty(item, this.bindLabel)
        ? (item[this.bindLabel] as string)
        : (item as unknown as string)
      : this.bindLabel && typeof this.bindLabel === 'function'
      ? (this.bindLabel(item) as string)
      : (item as unknown as string);
  }

  private _listenToScreenSizeChange() {
    this.screenService.screenSizeObserver$.pipe(takeUntil(this.destroy$)).subscribe((size) => {
      this.screenSize = size;
      this.chart.first
        ?.updateOptions(
          this.appChartTypesService.getRangeOptions(size, BarChartTypes.SINGLE_BAR, this.seriesDataLength)
        )
        .then(() => {
          this.cdr.detectChanges();
        });
    });
  }

  private _initializeFormatters() {
    this.chartOptions
      .addDataLabelsFormatter((val, opts) =>
        this.appChartTypesService.dataLabelsFormatter({ val, opts }, this.rootData)
      )
      .addAxisYFormatter((val, opts) => this.appChartTypesService.axisYFormatter({ val, opts }, this.rootData))
      .addUpdatedCallback(this._onNationalitiesChartUpdated)
      .addDataPointSelectionCallback(this._onNationalitiesChartDataPointSelection)
      .addCustomToolbarOptions();
  }

  private _onNationalitiesChartUpdated = (chartContext: ChartContext, config: ChartConfig) => {
    const hasData = (config.config.series?.[0]?.data as { x: number; y: number; id: number }[] | undefined)?.filter(
      (item) => item.id
    ).length;
    if (!hasData) {
      return;
    }
    if (this.isChartFirstUpdate) {
      this.chart.first?.toggleDataPointSelection(
        0,
        (chartContext.w.config.series[0].data as unknown as { index: number; id: number }[]).filter(
          (item) => item.id === this.selectedNationality.id
        )[0].index
      );
    } else {
      if (!this.isUpdatingChartData) return;
      if (this.selectedNationality.dataPointIndex < (chartContext.w.config.series[0].data as unknown[]).length) {
        this.chart.first?.toggleDataPointSelection(
          this.selectedNationality.seriesIndex,
          this.selectedNationality.dataPointIndex
        );
      }
      this.chart.first?.toggleDataPointSelection(
        0,
        (chartContext.w.config.series[0].data as unknown as { index: number; id: number }[]).length - 1
      );
    }
  };

  private _onNationalitiesChartDataPointSelection = (
    event: MouseEvent,
    chartContext: ChartContext,
    config: DataPointSelectionConfig
  ) => {
    if (config.selectedDataPoints[config.seriesIndex].length === 0) return;
    if (!event && !this.isChartFirstUpdate && !this.isUpdatingChartData) return;
    this.isChartFirstUpdate = false;
    this.isUpdatingChartData = false;
    this.selectedNationality = {
      id: (chartContext.w.config.series[config.seriesIndex].data[config.dataPointIndex] as unknown as { id: number })
        .id,
      seriesIndex: config.seriesIndex,
      dataPointIndex: config.dataPointIndex,
    };

    const _nationalityName = this._getLabel({ nationalityId: this.selectedNationality.id });

    this.chart.first?.clearAnnotations();
    this.chart.first?.addXaxisAnnotation(this.appChartTypesService.getXAnnotaionForSelectedBar(_nationalityName), true);

    this.selectedNationalityChanged.emit({ nationalityCode: this.selectedNationality.id });
  };
}