import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  EquipmentItemMapper,
  EquipmentItemSchema,
} from "./equipment-item.schema";
import { EquipmentItem } from "src/modules/inventory/domain/entities/equipment-item.entity";

@Injectable()
export class EquipmentItemRepository {
  constructor(
    @InjectRepository(EquipmentItemSchema)
    private readonly repository: Repository<EquipmentItemSchema>
  ) {}

  async save(item: EquipmentItem): Promise<void> {
    await this.repository.save(EquipmentItemMapper.toPersistence(item));
  }

  async countAvailableByType(equipmentTypeId: string): Promise<number> {
    return this.repository.countBy({
      equipmentTypeId,
      status: "Available", // domain enum value
    });
  }

  async existsSerial(serialNumber: string): Promise<boolean> {
    return this.repository.exists({ where: { serialNumber } });
  }

  async findById(id: string): Promise<EquipmentItem | null> {
    const raw = await this.repository.findOneBy({ id });
    return raw ? EquipmentItemMapper.toDomain(raw) : null;
  }
}
