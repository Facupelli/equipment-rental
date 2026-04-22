import { IQuery } from '@nestjs/cqrs';

export class GetOrdersCalendarQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly rangeStart: string,
    public readonly rangeEnd: string,
  ) {}
}
