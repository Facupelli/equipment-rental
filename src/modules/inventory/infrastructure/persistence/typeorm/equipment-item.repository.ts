// src/modules/inventory/infrastructure/repositories/equipment.repository.ts

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import {
  EquipmentItemMapper,
  EquipmentItemEntity,
} from "./equipment-item.entity";
import {
  EquipmentItem,
  EquipmentStatus,
} from "src/modules/inventory/domain/models/equipment-item.model";

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
    @InjectRepository(EquipmentItemEntity)
    private readonly repository: Repository<EquipmentItemEntity>
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
      ? manager.getRepository(EquipmentItemEntity)
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

    return schemas.map(EquipmentItemMapper.toDomain);
  }

  /**
   * Find items already allocated to a specific reservation (for idempotency)
   */
  async findByReservationId(
    reservationId: string,
    manager?: EntityManager
  ): Promise<EquipmentItem[]> {
    const repo = manager
      ? manager.getRepository(EquipmentItemEntity)
      : this.repository;

    const schemas = await repo.find({});

    return schemas.map(EquipmentItemMapper.toDomain);
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
      ? manager.getRepository(EquipmentItemEntity)
      : this.repository;

    const schema = EquipmentItemMapper.toEntity(item);

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
    items: EquipmentItemEntity[],
    manager?: EntityManager
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(EquipmentItemEntity)
      : this.repository;

    const schemas = items.map(EquipmentItemMapper.toEntity);
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
      ? manager.getRepository(EquipmentItemEntity)
      : this.repository;

    return repo.count({
      where: {
        equipmentTypeId,
        status: EquipmentStatus.Available,
      },
    });
  }
}
