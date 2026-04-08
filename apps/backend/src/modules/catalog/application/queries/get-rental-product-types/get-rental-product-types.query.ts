import { IQuery } from '@nestjs/cqrs';
import { RentalProductSort } from '@repo/schemas';

export const DEFAULT_RENTAL_PRODUCT_SORT: RentalProductSort = 'price-desc';

export class GetRentalProductTypesQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly pickupDate: string | undefined,
    public readonly returnDate: string | undefined,
    public readonly categoryId?: string,
    public readonly search?: string,
    public readonly sort: RentalProductSort = DEFAULT_RENTAL_PRODUCT_SORT,
    public readonly page?: number,
    public readonly limit?: number,
  ) {}
}
