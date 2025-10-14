import { CommandHandler } from "@nestjs/cqrs";
import { CreateEquipmentTypeCommand } from "./create-equipment-type.command";

@CommandHandler(CreateEquipmentTypeCommand)
export class CreateEquipmentTypeHandler {
  constructor() {}

  async execute(command: CreateEquipmentTypeCommand): Promise<string> {
    return "test";
  }
}
