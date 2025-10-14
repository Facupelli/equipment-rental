import { ICommand } from "@nestjs/cqrs";

export class CreateCategoryCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly parentId: string
  ) {}
}
