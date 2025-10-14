import { ICommand } from "@nestjs/cqrs";

export class CreateEquipmentTypeCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly categoryId: string
  ) {}
}
