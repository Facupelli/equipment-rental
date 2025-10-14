import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { RegisterEquipmentCommand } from "./register-equipment.command";
import { ConflictException, BadRequestException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { EquipmentItem } from "src/modules/inventory/domain/entities/equipment-item.entity";
import { EquipmentItemRepository } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.repository";

@CommandHandler(RegisterEquipmentCommand)
export class RegisterEquipmentHandler
  implements ICommandHandler<RegisterEquipmentCommand, string>
{
  constructor(
    private readonly equipmentItemRepository: EquipmentItemRepository
  ) {}

  async execute(command: RegisterEquipmentCommand): Promise<string> {
    const { equipmentTypeId, serialNumber } = command;

    if (!equipmentTypeId || !serialNumber) {
      throw new BadRequestException(
        "Equipment type ID and serial number are required"
      );
    }

    if (serialNumber.trim().length === 0) {
      throw new BadRequestException("Serial number cannot be empty");
    }

    const existing = await this.equipmentItemRepository.existsSerial(
      serialNumber
    );
    if (existing) {
      throw new ConflictException(
        `Equipment with serial number ${serialNumber} already exists`
      );
    }

    // Create new equipment item
    const equipmentItem = EquipmentItem.create(
      uuidv4(),
      equipmentTypeId,
      serialNumber.trim()
    );

    // Persist
    await this.equipmentItemRepository.save(equipmentItem);

    return equipmentItem.id;
  }
}
