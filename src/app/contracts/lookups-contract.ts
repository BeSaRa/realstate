import { Lookup } from '@models/lookup';

export interface LookupsContract {
  propertyTypeList: Lookup[];
  rentPurposeList: Lookup[];
  zoneList: Lookup[];
  municipalityList: Lookup[];
  rooms: Lookup[];
  furnitureStatusList: Lookup[];
  durations: Lookup[];
  halfYearDurations: Lookup[];
  quarterYearDurations: Lookup[];
  spaces: Lookup[];
  unitStatus: Lookup[];
  districtList: Lookup[];
  nationalityList: Lookup[];
  ownerCategoryList: Lookup[];
  ageCategoryList: Lookup[];
  genderList: Lookup[];
}
