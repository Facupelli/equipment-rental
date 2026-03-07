import { IQuery } from '@nestjs/cqrs';

export class GetOrdersScheduleQuery implements IQuery {
  constructor(
    public readonly locationId: string,
    public readonly from: string,
    public readonly to: string,
  ) {}
}
