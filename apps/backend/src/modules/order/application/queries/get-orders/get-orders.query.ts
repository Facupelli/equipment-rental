import type { OrderListDateLens, OrderListSortBy, OrderListSortDirection } from '@repo/schemas';
import { OrderStatus } from '@repo/types';

export class GetOrdersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly locationId?: string,
    public readonly customerId?: string,
    public readonly statuses?: OrderStatus[],
    public readonly orderNumber?: number,
    public readonly dateLens?: OrderListDateLens,
    public readonly sortBy?: OrderListSortBy,
    public readonly sortDirection?: OrderListSortDirection,
  ) {}
}
