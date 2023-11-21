import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BrokerDetailsPopupComponent } from '@components/broker-details-popup/broker-details-popup.component';
import { BrokerComponent } from '@components/broker/broker.component';
import { BrokersListPopupComponent } from '@components/brokers-list-popup/brokers-list-popup.component';
import { ButtonComponent } from '@components/button/button.component';
import { ExtraHeaderComponent } from '@components/extra-header/extra-header.component';
import { KpiRootComponent } from '@components/kpi-root/kpi-root.component';
import { TransactionsFilterComponent } from '@components/transactions-filter/transactions-filter.component';
import { CriteriaContract } from '@contracts/criteria-contract';
import { CriteriaType } from '@enums/criteria-type';
import { Broker } from '@models/broker';
import { KpiRoot } from '@models/kpi-root';
import { CsvService } from '@services/csv.service';
import { DashboardService } from '@services/dashboard.service';
import { DialogService } from '@services/dialog.service';
import { LookupService } from '@services/lookup.service';
import { TranslationService } from '@services/translation.service';
import { UrlService } from '@services/url.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-broker-indicators-page',
  standalone: true,
  imports: [
    CommonModule,
    ExtraHeaderComponent,
    TransactionsFilterComponent,
    BrokerComponent,
    KpiRootComponent,
    ButtonComponent,
  ],
  templateUrl: './broker-indicators-page.component.html',
  styleUrls: ['./broker-indicators-page.component.scss'],
})
export default class BrokerIndicatorsPageComponent {
  lang = inject(TranslationService);
  lookupService = inject(LookupService);
  dialog = inject(DialogService);
  urlService = inject(UrlService);
  dashboardService = inject(DashboardService);
  csvService = inject(CsvService);

  municipalities = this.lookupService.brokerLookups.municipalityList;
  brokerCategories = this.lookupService.brokerLookups.brokerCategoryList;

  criteria = {} as {
    criteria: CriteriaContract & { brokerCategoryId: number };
    type: CriteriaType;
  };

  totalBrokers = new KpiRoot().clone<KpiRoot>({
    arName: this.lang.getArabicTranslation('total_number_of_licensed_brokers'),
    enName: this.lang.getEnglishTranslation('total_number_of_licensed_brokers'),
    url: this.urlService.URLS.BROKER_KPI1,
    iconUrl: 'assets/icons/broker/1.svg',
  });

  brokers: Broker[] = [];

  filterChange({ criteria, type }: { criteria: CriteriaContract; type: CriteriaType }) {
    this.criteria = { criteria: criteria as CriteriaContract & { brokerCategoryId: number }, type };

    if (type === CriteriaType.DEFAULT) return;

    this.dashboardService
      .loadKpiRoot(this.totalBrokers, this.criteria.criteria)
      .pipe(take(1))
      .subscribe((value) => {
        this.totalBrokers.kpiData = value[0];
      });

    this.dashboardService
      .loadBrokers(this.criteria.criteria)
      .pipe(take(1))
      .subscribe((brokers) => (this.brokers = brokers.transactionList));
  }

  showBrokerDetails(broker: Broker) {
    this.dialog.open(BrokerDetailsPopupComponent, { data: broker, maxWidth: '95vw', minWidth: '60vw' });
  }

  showAllBrokers() {
    this.dialog.open(BrokersListPopupComponent, {
      data: {
        title: this.lang.map.brokers_list,
        brokers: this.brokers,
      },
      maxWidth: '95vw',
      minWidth: '95vw',
      maxHeight: '95vh',
    });
  }

  downloadBrokersList() {
    const _data = this.csvService.arrayToCsv(this.brokers, [
      { key: this.lang.isLtr ? 'managerEnName' : 'managerArName', mapTo: this.lang.map.broker_name },
      { key: this.lang.isLtr ? 'brokerEnName' : 'brokerArName', mapTo: this.lang.map.company_name },
      { key: 'brokerPhone1', mapTo: this.lang.map.phone },
      { key: 'brokerEmail', mapTo: this.lang.map.email },
    ]);

    this.csvService.downloadCsvFile(
      this.lang.map.brokers_list +
        '-' +
        this.lookupService.brokerMunicipalitiesMap[this.criteria.criteria.municipalityId].getNames() +
        '-' +
        new Date(Date.now()).toDateString(),
      _data
    );
  }
}
