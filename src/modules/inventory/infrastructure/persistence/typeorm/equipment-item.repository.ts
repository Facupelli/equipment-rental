// src/modules/inventory/infrastructure/repositories/equipment.repository.ts

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import { EquipmentItemSchema } from "./equipment-item.schema";
import {
  EquipmentItem,
  EquipmentStatus,
} from "src/modules/inventory/domain/entities/equipment-item.entity";
import { ReservationId } from "src/modules/booking/domain/value-objects/reservation-id.vo";

/**
 * Repository: EquipmentItem
 *
 * Handles persistence and retrieval of equipment items.
 * Maps between domain entities and TypeORM schemas.
 */
@Injectable()
export class EquipmentItemRepository {
  private readonly logger = new Logger(EquipmentItemRepository.name);

  constructor(
    @InjectRepository(EquipmentItemSchema)
    private readonly repository: Repository<EquipmentItemSchema>
  ) {}

  /**
   * Find available equipment items by type (FIFO allocation)
   *
   * @param equipmentTypeId - Type of equipment to find
   * @param quantity - Number of items needed
   * @param manager - Optional transaction manager for atomic operations
   * @returns Array of available items (may be less than requested quantity)
   */
  async findAvailableByType(
    equipmentTypeId: string,
    quantity: number,
    manager?: EntityManager
  ): Promise<EquipmentItem[]> {
    const repo = manager
      ? manager.getRepository(EquipmentItemSchema)
      : this.repository;

    const schemas = await repo.find({
      where: {
        equipmentTypeId,
        status: EquipmentStatus.Available,
      },
      take: quantity,
      order: {
        createdAt: "ASC", // FIFO: allocate oldest items first
      },
    });

    return schemas.map(this.toDomain);
  }

  /**
   * Find items already allocated to a specific reservation (for idempotency)
   */
  async findByReservationId(
    reservationId: ReservationId,
    manager?: EntityManager
  ): Promise<EquipmentItem[]> {
    const repo = manager
      ? manager.getRepository(EquipmentItemSchema)
      : this.repository;

    const schemas = await repo.find({
      where: {
        allocatedToReservationId: reservationId,
        status: EquipmentStatus.Allocated,
      },
    });

    return schemas.map(this.toDomain);
  }

  async existsSerial(serialNumber: string): Promise<boolean> {
    return this.repository.exists({ where: { serialNumber } });
  }

  /**
   * Save equipment item with optimistic locking
   *
   * @throws OptimisticLockVersionMismatchError if version conflict occurs
   */
  async save(item: EquipmentItem, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(EquipmentItemSchema)
      : this.repository;

    const schema = this.toSchema(item);

    try {
      await repo.save(schema);
    } catch (error) {
      // TypeORM throws OptimisticLockVersionMismatchError on version conflict
      this.logger.error(
        `Failed to save equipment item ${item.id}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Batch save multiple items (used by allocation handler)
   */
  async saveMany(
    items: EquipmentItem[],
    manager?: EntityManager
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(EquipmentItemSchema)
      : this.repository;

    const schemas = items.map(this.toSchema);
    await repo.save(schemas);
  }

  /**
   * Count total available items by type (for capacity queries)
   */
  async countAvailableByType(
    equipmentTypeId: string,
    manager?: EntityManager
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(EquipmentItemSchema)
      : this.repository;

    return repo.count({
      where: {
        equipmentTypeId,
        status: EquipmentStatus.Available,
      },
    });
  }

  // --- Mapping Methods ---

  private toDomain(schema: EquipmentItemSchema): EquipmentItem {
    const item = new EquipmentItem({
      id: schema.id,
      equipmentTypeId: schema.equipmentTypeId,
      serialNumber: schema.serialNumber,
      status: schema.status,
    });

    // Restore allocation state
    item.allocatedToReservationId = schema.allocatedToReservationId;
    item.allocatedUntil = schema.allocatedUntil;
    item.version = schema.version;
    item.createdAt = schema.createdAt;
    item.updatedAt = schema.updatedAt;

    return item;
  }

  private toSchema(item: EquipmentItem): EquipmentItemSchema {
    const schema = new EquipmentItemSchema();
    schema.id = item.id;
    schema.equipmentTypeId = item.equipmentTypeId;
    schema.serialNumber = item.serialNumber;
    schema.status = item.status;
    schema.allocatedToReservationId = item.allocatedToReservationId;
    schema.allocatedUntil = item.allocatedUntil;
    schema.version = item.version;
    schema.createdAt = item.createdAt;
    schema.updatedAt = item.updatedAt;
    return schema;
  }
}
