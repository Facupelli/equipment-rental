import { IQuery } from '@nestjs/cqrs';
import { RentalProductSort } from '@repo/schemas';

export const DEFAULT_RENTAL_PRODUCT_SORT: RentalProductSort = 'price-desc';

export class GetRentalProductTypesQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly startDate: Date | undefined,
    public readonly endDate: Date | undefined,
    public readonly categoryId?: string,
    public readonly search?: string,
    public readonly sort: RentalProductSort = DEFAULT_RENTAL_PRODUCT_SORT,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
