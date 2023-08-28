const rentEndPoints = {
  RENT: 'BE|kpi/rent',
  RENT_LOOKUPS: 'BE|kpi/rent/lookup',
  DEFAULT_RENT: 'RENT|default',
  RENT_KPI1: 'RENT|kpi1/total-contracts', // root
  RENT_KPI2: 'RENT|kpi2/total-contracts/purpose',
  RENT_KPI3: 'RENT|kpi3/total-contracts/property',
  RENT_KPI4: 'RENT|kpi4/total-units', // root
  RENT_KPI5: 'RENT|kpi5/total-units/purpose',
  RENT_KPI6: 'RENT|kpi6/total-units/property',
  RENT_KPI7: 'RENT|kpi7/contract-value', // root
  RENT_KPI8: 'RENT|kpi8/contract-value/purpose',
  RENT_KPI9: 'RENT|kpi9/contract-value/property',
  RENT_KPI10: 'RENT|kpi10/total-area', // root
  RENT_KPI11: 'RENT|kpi11/total-area/purpose',
  RENT_KPI12: 'RENT|kpi12/total-area/property',
  RENT_KPI13: 'RENT|kpi13/mean-value', // root
  RENT_KPI14: 'RENT|kpi14/mean-value/purpose',
  RENT_KPI15: 'RENT|kpi15/mean-value/property',
  RENT_KPI16: 'RENT|kpi16/mean-area', // root
  RENT_KPI17: 'RENT|kpi17/mean-area/purpose',
  RENT_KPI18: 'RENT|kpi18/mean-area/property',
  RENT_KPI19: 'RENT|kpi19/chart/contract-number',
  RENT_KPI20: 'RENT|kpi20/chart/units',
  RENT_KPI21: 'RENT|kpi21/chart/contract-value',
  RENT_KPI22: 'RENT|kpi22/chart/area',
  RENT_KPI23: 'RENT|kpi23/chart/rent-mean-value',
  RENT_KPI24: 'RENT|kpi24/chart/rent-sqt-meter',
  // transactions based on (Purpose, type)
  RENT_KPI25: 'RENT|kpi25/chart/rent-sqt-meter/rent-purpose',
  RENT_KPI26: 'RENT|kpi26/chart/purpose',
  // RENT_KPI24: 'RENT|kpi24/chart/rent-sqt-meter',

  // summary transactions
  RENT_KPI29: 'RENT|kpi29/summary',
  // top 10
  RENT_KPI30: 'RENT|kpi30/stats/certificate-count',
  RENT_KPI30_1: 'RENT|kpi30_1/stats/contract-count',
  RENT_KPI31: 'RENT|kpi31/stats/mean-rent-amount',
  RENT_KPI31_1: 'RENT|kpi31_1/stats/mean-rent-meter',
  RENT_KPI32: 'RENT|kpi32/stats/rent-amount',
  RENT_KPI33: 'RENT|kpi33/stats/area',
  RENT_KPI34: 'RENT|kpi34/stats/bed-rooms-count',
  RENT_KPI34_1: 'RENT|kpi34_1/stats/furniture-status',
  // collection of transactions tables
  RENT_KPI35_36_37: 'RENT|kpi35_36_37/stats/indicators',
};

const sellEndPoints = {
  SELL: 'BE|kpi/sell',
  SELL_LOOKUPS: 'BE|kpi/sell/lookup',
  DEFAULT_SELL: 'SELL|default',
  SELL_KPI1: 'SELL|kpi1/total-contracts', // root
  SELL_KPI2: 'SELL|kpi2/total-contracts/purpose',
  SELL_KPI3: 'SELL|kpi3/total-contracts/property',
  SELL_KPI4: 'SELL|kpi4/total-units', // root
  SELL_KPI5: 'SELL|kpi5/total-units/purpose',
  SELL_KPI6: 'SELL|kpi6/property',
  SELL_KPI7: 'SELL|kpi7/total-transactions', // root
  SELL_KPI8: 'SELL|kpi8/total-transactions/purpose',
  SELL_KPI9: 'SELL|kpi9/total-transactions/property',
  SELL_KPI10: 'SELL|kpi10/total-areas', // root
  SELL_KPI11: 'SELL|kpi11/total-areas/purpose',
  SELL_KPI12: 'SELL|kpi12/total-areas/property',
  SELL_KPI13: 'SELL|kpi13/mean-value', // root
  SELL_KPI14: 'SELL|kpi14/mean-value/purpose',
  SELL_KPI15: 'SELL|kpi15/mean-value/property',
  SELL_KPI16: 'SELL|kpi16/mean-area', // root
  SELL_KPI17: 'SELL|kpi17/mean-area/purpose',
  SELL_KPI18: 'SELL|kpi18/mean-area/property',

  ///// charts
  SELL_KPI19: 'SELL|kpi19/chart/certificate-count',
  SELL_KPI20: 'SELL|kpi20/chart/unit-count',
  SELL_KPI21: 'SELL|kpi21/chart/transaction-count',
  SELL_KPI22: 'SELL|kpi22/chart/area-amount',
  SELL_KPI23: 'SELL|kpi23/chart/mean-unit-price',
  SELL_KPI24: 'SELL|kpi24/chart/mean-unit-sqt-price',

  SELL_KPI25: 'SELL|kpi25/stats/indicator/purpose',
  SELL_KPI26: 'SELL|kpi26/chart/indicator/purpose',
  SELL_KPI27: 'SELL|kpi27/stats/indicator/property',

  SELL_KPI29: 'SELL|kpi29/transactions',

  SELL_KPI30: 'SELL|kpi30/zones/transactions-number',
  SELL_KPI31: 'SELL|kpi31/zones/unit-price',
  SELL_KPI32: 'SELL|kpi32/zones/transactions-value',
  SELL_KPI33: 'SELL|kpi33/zones/areas',
  SELL_KPI33_1: 'SELL|kpi33_1/zones/real-estate-number',
  SELL_KPI33_2: 'SELL|kpi33_2/zones/real-estate-mt-value',

  SELL_KPI34: 'SELL|kpi34/stats/bed-rooms-count',

  SELL_KPI35_36_37: 'SELL|kpi35_36_37/stats/indicators',
};
const mortgage = {
  MORT: 'BE|kpi/mortgage',
  MORT_LOOKUPS: 'MORT|lookup',
  MORT_KPI1: 'MORT|kpi1/transaction-number', // root
  MORT_KPI2: 'MORT|kpi2/chart/contract-change-rate',
  MORT_KPI2_H: 'MORT|kpi2/chart/contract-change-rate/halfly',
  MORT_KPI2_M: 'MORT|kpi2/chart/contract-change-rate/monthly',
  MORT_KPI2_Q: 'MORT|kpi2/chart/contract-change-rate/quartley',
  MORT_KPI3: 'MORT|kpi3/unit-num', // root
  MORT_KPI4: 'MORT|kpi4/chart/unit-num-rate',
  MORT_KPI4_H: 'MORT|kpi4/chart/unit-num-rate/halfly',
  MORT_KPI4_M: 'MORT|kpi4/chart/unit-num-rate/monthly',
  MORT_KPI4_Q: 'MORT|kpi4/chart/unit-num-rate/quartley',
  MORT_KPI5: 'MORT|kpi5/stats/transaction-value', // root
  MORT_KPI6: 'MORT|kpi6/chart/transaction-value-rate',
  MORT_KPI6_H: 'MORT|kpi6/chart/transaction-value-rate/halfly',
  MORT_KPI6_M: 'MORT|kpi6/chart/transaction-value-rate/monthly',
  MORT_KPI6_Q: 'MORT|kpi6/chart/transaction-value-rate/quartley',
  MORT_KPI7: 'MORT|kpi6/detail/transaction',
};

export const EndPoints = {
  BASE_URL: '',
  TRANSLATION: 'translations',
  BE: 'http://eblaepm.no-ip.org:7800/mme-services/',
  ...rentEndPoints,
  ...sellEndPoints,
  ...mortgage,
};

export type EndpointsType = typeof EndPoints;
