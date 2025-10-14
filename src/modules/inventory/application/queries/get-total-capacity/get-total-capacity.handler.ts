import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetTotalCapacityQuery } from "./get-total-capacity.query";

@QueryHandler(GetTotalCapacityQuery)
export class GetTotalCapacityHandler
  implements IQueryHandler<GetTotalCapacityQuery, number>
{
  constructor() {}

  async execute(query: GetTotalCapacityQuery): Promise<number> {
    return 10;
  }
}
