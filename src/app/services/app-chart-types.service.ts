import { Injectable, inject } from '@angular/core';
import { PartialChartOptions } from '@app-types/partialChartOptions';
import { PieChartOptions } from '@app-types/pie-chart-options';
import { AppColors } from '@constants/app-colors';
import { maskSeparator } from '@constants/mask-separator';
import { MinMaxAvgContract } from '@contracts/min-max-avg-contract';
import { BarChartTypes } from '@enums/bar-chart-type';
import { Breakpoints } from '@enums/breakpoints';
import { formatNumber, minMaxAvg } from '@utils/utils';
import { NgxMaskPipe } from 'ngx-mask';
import { TranslationService } from './translation.service';
import { KpiModel } from '@models/kpi-model';
import { KpiDurationModel } from '@models/kpi-duration-model';
import { ChartComponent } from 'ng-apexcharts';
import { DurationEndpoints } from '@enums/durations';
import { ChartType} from '@enums/chart-type';

@Injectable({
  providedIn: 'root',
})
export class AppChartTypesService {
  lang = inject(TranslationService);
  maskPipe = inject(NgxMaskPipe);
  // protected readonly DurationTypes = DurationEndpoints;
  // protected readonly ChartType = ChartType;

  private _mainChartOptions: PartialChartOptions = mainChartOptions;
  get mainChartOptions() {
    return { ...this._mainChartOptions };
  }
  get yearlyStaticChartOptions() {
    return { tooltip: { marker: { fillColors: [AppColors.JUNGLE] } } };
  }
  get halflyAndQuarterlyStaticChartOptions() {
    return {
      colors: [
        AppColors.PRIMARY,
        AppColors.SECONDARY,
        AppColors.GRAY,
        AppColors.INDIGO_RAINBOW,
        AppColors.GREEN_LIGHT,
        AppColors.PRIMARY_LIGHT,
        AppColors.AZURE,
        AppColors.GRAY_TOO,
      ],
      tooltip: {
        marker: {
          fillColors: [
            AppColors.PRIMARY,
            AppColors.SECONDARY,
            AppColors.GRAY,
            AppColors.INDIGO_RAINBOW,
            AppColors.GREEN_LIGHT,
            AppColors.PRIMARY_LIGHT,
            AppColors.AZURE,
            AppColors.GRAY_TOO,
          ],
        },
      },
    };
  }
  get monthlyStaticChartOptions() {
    return { tooltip: { marker: { fillColors: [AppColors.JUNGLE] } } };
  }

  private _top10LineChartOptions = top10LineChartOptions;
  private _top10BarChartOptions = top10BarChartOptions;
  get top10ChartOptions(): { line: Partial<PartialChartOptions>; bar: Partial<PartialChartOptions> } {
    return { line: { ...this._top10LineChartOptions }, bar: { ...this._top10BarChartOptions } };
  }

  private _pieChartOptions = pieChartOptions;
  get pieChartOptions() {
    return {
      ...this._pieChartOptions,
      legend: {
        formatter: this.legendFormatter,
      },
    };
  }

  private _popupChartOptions = popupChartOptions;
  get popupChartOptions() {
    return { ...this._popupChartOptions };
  }

  getRangeOptions = getRangeOptions;

  dataLabelsFormatter(
    value: { val: string | number | number[]; opts?: any },
    root?: { hasPrice: boolean }
  ): string | number {
    return this._labelFormatter(value.val, root);
  }

  axisXFormatter(
    value: { val: string; timestamp?: number; opts?: any },
    root?: { hasPrice: boolean }
  ): string | string[] {
    return this._labelFormatter(value.val, root);
  }

  axisYFormatter(value: { val: number; opts?: any }, root?: { hasPrice: boolean }): string | string[] {
    return this._labelFormatter(value.val, root);
  }

  popupLabelsFormatter = (val: string | number | number[], opts?: { seriesIndex: number }) => {
    if (typeof val === 'undefined') return val;
    if (typeof val === 'string' && (val as unknown as number) !== undefined && (val as unknown as number) !== null)
      return val;
    const value = val as unknown as number;
    return opts?.seriesIndex === 0
      ? (formatNumber(value) as string)
      : (this.maskPipe.transform(value.toFixed(0), maskSeparator.SEPARATOR, {
        thousandSeparator: ',',
      }) as unknown as string);
  };

  legendFormatter = (legendName: string, opts: any) => {
    return this.lang.getCurrent().direction === 'rtl'
      ? '( ' + opts.w.globals.series[opts.seriesIndex] + ' ) : ' + legendName
      : legendName + ' : ( ' + opts.w.globals.series[opts.seriesIndex] + ' )';
  };

  chartColorsFormatter(minMaxAvg: MinMaxAvgContract) {
    return ({ value }: { value: number }): string => {
      if (value >= minMaxAvg.min && value < minMaxAvg.avg) return AppColors.GRAY;
      if (value >= minMaxAvg.avg && value < minMaxAvg.max) return AppColors.SECONDARY;
      return AppColors.PRIMARY;
    };
  }

  splitChartDataToLevels(name: string | undefined, data: (KpiModel[] | KpiDurationModel[]), months?: string[]) {
    const _minMaxAvg = minMaxAvg(data.map((item) => item.kpiVal));
    const series = [
      {
        name: name + "_low",
        data: data.map((item) => {
          return {
            y: item.kpiVal >= _minMaxAvg.min ? _minMaxAvg.min : item.kpiVal,
            x: item instanceof KpiModel ? item.issueYear : months?.at(item?.issuePeriod - 1)
          }
        }),
        color: AppColors.GRAY
      },
      {
        name: name + "_mid",
        data: data.map((item) => {
          return {
            y: item.kpiVal > _minMaxAvg.avg ? _minMaxAvg.avg : item.kpiVal - _minMaxAvg.min,
            x: item instanceof KpiModel ? item.issueYear : months?.at(item?.issuePeriod - 1)
          }
        }),
        color: AppColors.SECONDARY
      },
      {
        name: name + "_high",
        data: data.map((item) => {
          return {
            y: item.kpiVal > _minMaxAvg.avg ? item.kpiVal - _minMaxAvg.avg : 0,
            x: item instanceof KpiModel ? item.issueYear : months?.at(item?.issuePeriod - 1)
          }
        }),
        color: AppColors.PRIMARY
      },
    ];
    return series;
  }

  private _labelFormatter(val: string | number | number[], root?: { hasPrice: boolean }) {
    if (typeof val === 'undefined') return val;
    if (typeof val === 'string' && (val as unknown as number) !== undefined && (val as unknown as number) !== null)
      return val;
    const value = val as unknown as number;
    return root?.hasPrice
      ? (formatNumber(value) as string)
      : (this.maskPipe.transform(value.toFixed(0), maskSeparator.SEPARATOR, {
        thousandSeparator: ',',
      }) as unknown as string);
  }

  updateChartHelper(chart: ChartComponent, data: KpiModel[] | KpiDurationModel[] | any[], isStacked: boolean,
    screenSize: Breakpoints, selectedDurationBarChartType: BarChartTypes, durationDataLength: number,
    enableDataLable: boolean, enableTotalLable: boolean, selectedRoot: string = '', months: string[] = [], isHalfy: boolean = false) {
    chart.updateOptions({
        chart: { stacked: isStacked },
        series: isHalfy ? data : this.splitChartDataToLevels(selectedRoot, data, months),
        ...this.yearlyStaticChartOptions,
        ...this.getRangeOptions(
          screenSize,
          selectedDurationBarChartType,
          durationDataLength
        ),
        dataLabels: { enabled: enableDataLable },
        plotOptions: {
          bar: {
            dataLabels: {
              total: {
                enabled: enableTotalLable,
                formatter: (val: string): string => {
                  return formatNumber(Number(val)) as string;
                },
                style: { color: '#259C80' },
              },
            },
          },
        },
      }).then();
  }

  resetChartState(chart: ChartComponent, data: KpiModel[]| any[], monthlydata: KpiDurationModel[] , 
    durationType: DurationEndpoints, type: ChartType, name?: string, months: string[] = []) {
      if (durationType === DurationEndpoints.YEARLY) {

        chart.updateOptions({
          series: (type !== ChartType.BAR)
            ? [
              {
                name: name,
                data: data.map((item) => ({ y: item.kpiVal, x: item.issueYear })),
                color: AppColors.PRIMARY
              },
            ]
            : this.splitChartDataToLevels(name, data),
        }).then();
      }
      else if (durationType === DurationEndpoints.MONTHLY) {
        chart.updateOptions({
          series: type !== ChartType.BAR
            ? [{
              name: name,
              data: monthlydata.map((item) => {
                return {
                  y: item.kpiVal,
                  x: months[item.issuePeriod - 1],
                };
              },),
              color: AppColors.PRIMARY
            }]
            : this.splitChartDataToLevels(name, monthlydata, months),
        }).then();
      }
      else {
        chart.updateOptions({
          dataLabels: { enabled: type === ChartType.BAR, style: { colors: [AppColors.JUNGLE] } },
          colors: [AppColors.PRIMARY, AppColors.SECONDARY, AppColors.PRIMARY, AppColors.INDIGO_RAINBOW],
        })
      }
      chart.updateOptions({ chart: { type: type } })
  }
}



const mainChartOptions: PartialChartOptions = {
  series: [],
  chart: {
    height: 350,
    type: 'line',
  },
  dataLabels: {
    enabled: true,
    // formatter: don't forget to set formatter when use chart
    style: { colors: [AppColors.JUNGLE] },
  },
  stroke: {
    curve: 'smooth',
    // colors: [AppColors.SECONDARY],
  },
  grid: {
    row: {
      colors: [AppColors.GRAY_LIGHT, 'transparent'],
      opacity: 0.5,
    },
  },
  xaxis: {
    categories: [],
    labels: {
      trim: true,
      rotate: -45,
      rotateAlways: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  plotOptions: {
    bar: {
      columnWidth: '80%',
    },
  },
  yaxis: {
    min: 0,
    max: (max) => max / 0.95,
    // tickAmount: 10,
    labels: {
      // formatter: don't forget to set formatter when use chart
      minWidth: 50,
      style: {
        fontWeight: 'bold',
      },
    },
    tooltip: {
      enabled: false,
    },
  },
  legend: { show: false },
  tooltip: { marker: { fillColors: [AppColors.JUNGLE] } },
};

const top10LineChartOptions: Partial<PartialChartOptions> = {
  series: [],
  chart: {
    type: 'line',
    height: 400,
    width: '100%',
  },
  dataLabels: {
    enabled: true,
    dropShadow: {
      enabled: true,
    },
    // formatter: don't forget to set formatter when use chart
  },
  stroke: {
    curve: 'smooth',
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
  },
  xaxis: {
    categories: [],
    labels: {
      trim: true,
      // formatter: don't forget to set formatter when use chart
    },
  },
  yaxis: {
    labels: {
      // formatter: don't forget to set formatter when use chart
      show: false,
      style: {
        fontFamily: 'inherit',
        fontSize: '12px',
      },
    },
  },
  colors: [AppColors.GREEN_LIGHT],
};

const top10BarChartOptions: Partial<PartialChartOptions> = {
  series: [],
  chart: {
    type: 'bar',
    height: 400,
    width: '100%',
  },
  dataLabels: {
    enabled: true,
    dropShadow: {
      enabled: true,
    },
    // formatter: don't forget to set formatter when use chart
  },
  stroke: {
    curve: 'smooth',
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
  },
  xaxis: {
    categories: [],
    labels: {
      show: false,
      // formatter: don't forget to set formatter when use chart
    },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      columnWidth: '20%',
      dataLabels: {
        position: 'bottom',
      },
    },
  },
  yaxis: {
    reversed: true,

    labels: {
      // formatter: don't forget to set formatter when use chart
      maxWidth: 100,
      style: {
        fontFamily: 'inherit',
        fontSize: '15px',
      },
    },
  },
  colors: [AppColors.GREEN_LIGHT],
};

const pieChartOptions: PieChartOptions = {
  chart: {
    type: 'pie',
    width: '100%',
  },
  labels: [],
  series: [1, 2, 53, 69, 7],

  colors: [
    AppColors.PRIMARY,
    AppColors.SECONDARY,
    AppColors.GRAY_TOO,
    AppColors.INDIGO_RAINBOW,
    AppColors.JUNGLE,
    AppColors.AZURE,
    AppColors.SAND,
    AppColors.GRAY,
    AppColors.GREEN_LIGHT,
    AppColors.GRAY_LIGHT,
    AppColors.PRIMARY_LIGHT,
  ],

  responsive: [
    {
      breakpoint: 2000,
      options: {
        chart: {
          width: 450,
        },
        legend: {
          // show: false,
          position: 'bottom',
          horizontalAlign: 'center',
          width: '100%',
        },
      },
    },
  ],
};

const popupChartOptions: Partial<PartialChartOptions> = {
  series: [],
  chart: {
    type: 'line',
    height: 350,
    width: 600,
  },
  // title: {
  //   text: this.lang.map.year + ' : ' + this.data[0].issueYear.toString(),
  //   align: 'center',
  //   floating: true,
  //   style: {
  //     fontFamily: 'inherit',
  //   },
  // },
  plotOptions: {},

  dataLabels: {
    enabled: true,
    // formatter: don't forget to set formatter to popup labels formatter when use chart
  },
  yaxis: [
    {
      title: {
        // text: don't forget to add yaxis title
      },
      labels: {
        // formatter: don't forget to add pricefull formatter
      },
    },
    {
      opposite: true,
      title: {
        // text: don't forget to add yaxis title
      },
      labels: {
        // formatter: don't forget to add priceless formatter
      },
    },
  ],
  xaxis: {
    tickPlacement: 'between',
    labels: {
      formatter: function (val: string) {
        if (typeof val === 'string') {
          const index = val.indexOf(' - ');
          return val.slice(0, index);
        }
        return '';
      },
    },
    group: {
      style: { fontSize: '16px', fontWeight: 700 },
      // groups: don't forget to add groups
    },
  },
};

function getRangeOptions(
  screenSize: Breakpoints,
  barChartType: BarChartTypes,
  dataCount: number,
  otherDenominator = 1
): PartialChartOptions {
  function getRange(defaultRange: number) {
    return dataCount <= defaultRange ? (dataCount <= 3 ? dataCount : dataCount - 1) : defaultRange;
  }

  let _range = 0;

  if (barChartType === BarChartTypes.SINGLE_BAR) {
    switch (screenSize) {
      case Breakpoints.XS:
        _range = getRange(4);
        break;
      case Breakpoints.SM:
        _range = getRange(8);
        break;
      case Breakpoints.MD:
        _range = getRange(12);
        break;
      case Breakpoints.LG:
        _range = getRange(16);
        break;
      case Breakpoints.XL:
        _range = getRange(20);
        break;
      case Breakpoints.XL2:
        _range = getRange(25);
        break;
    }
  } else if (barChartType === BarChartTypes.DOUBLE_BAR) {
    switch (screenSize) {
      case Breakpoints.XS:
        _range = getRange(3);
        break;
      case Breakpoints.SM:
        _range = getRange(6);
        break;
      case Breakpoints.MD:
        _range = getRange(9);
        break;
      case Breakpoints.LG:
        _range = getRange(12);
        break;
      case Breakpoints.XL:
        _range = getRange(15);
        break;
      case Breakpoints.XL2:
        _range = getRange(20);
        break;
    }
  } else {
    switch (screenSize) {
      case Breakpoints.XS:
        _range = getRange(3);
        break;
      case Breakpoints.SM:
        _range = getRange(4);
        break;
      case Breakpoints.MD:
        _range = getRange(6);
        break;
      case Breakpoints.LG:
        _range = getRange(8);
        break;
      case Breakpoints.XL:
        _range = getRange(10);
        break;
      case Breakpoints.XL2:
        _range = getRange(12);
        break;
    }
  }

  return {
    xaxis: { range: _range },
    plotOptions: {
      bar: {
        columnWidth:
          dataCount <= _range
            ? '40%'
            : Math.round((dataCount / _range / 1.5 / otherDenominator) * 100).toString() + '%',
      },
    },
  };
}
