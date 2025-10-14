import { CommandHandler } from "@nestjs/cqrs";
import { CreateCategoryCommand } from "./create-category.command";

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler {
  constructor() {}

  async execute(command: CreateCategoryCommand): Promise<string> {
    return "test";
  }
}
