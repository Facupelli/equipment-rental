import { DateRange } from './domain/value-objects/date-range.vo';

export type FindAvailableParams = {
  productTypeId: string;
  locationId: string;
  period: DateRange;
  quantity?: number;
  assetId?: string;
  excludeAssetIds?: string[];
};
