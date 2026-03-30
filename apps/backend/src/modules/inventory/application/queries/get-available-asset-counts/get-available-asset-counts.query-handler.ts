import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import {
  AvailableAssetCountReadModel,
  GetAvailableAssetCountsQuery,
} from 'src/modules/inventory/public/queries/get-available-asset-counts.query';

import { AssetAvailabilityService } from '../../../infrastructure/read-services/asset-availability.service';

@QueryHandler(GetAvailableAssetCountsQuery)
export class GetAvailableAssetCountsQueryHandler implements IQueryHandler<
  GetAvailableAssetCountsQuery,
  AvailableAssetCountReadModel[]
> {
  constructor(private readonly availabilityService: AssetAvailabilityService) {}

  async execute(query: GetAvailableAssetCountsQuery): Promise<AvailableAssetCountReadModel[]> {
    const countsByProductType = await this.availabilityService.getAvailableAssetCountsByProductType({
      productTypeIds: query.productTypeIds,
      locationId: query.locationId,
      period: DateRange.create(query.periodStart, query.periodEnd),
    });

    return query.productTypeIds.map((productTypeId) => ({
      productTypeId,
      availableCount: countsByProductType.get(productTypeId) ?? 0,
    }));
  }
}
