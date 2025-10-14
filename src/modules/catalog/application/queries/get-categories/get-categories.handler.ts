import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetCategoriesQuery } from "./get-categories.query";

interface CateogiresResult {
  categories: string[];
}

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler
  implements IQueryHandler<GetCategoriesQuery, CateogiresResult>
{
  constructor() {}

  async execute(): Promise<CateogiresResult> {
    return {
      categories: ["test"],
    };
  }
}
