import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  BLOCKING_ORDER_STATUSES,
  ReservationOrder,
} from "src/modules/booking/domain/models/reservation-order.model";
import { ReservationOrderMapper } from "./reservation.mappers";
import { ReservationOrderEntity } from "./reservation-order.entity";

@Injectable()
export class ReservationOrderRepository {
  constructor(
    @InjectRepository(ReservationOrderEntity)
    private readonly repository: Repository<ReservationOrderEntity>
  ) {}

  async save(reservationOrder: ReservationOrder): Promise<void> {
    const schema = ReservationOrderMapper.toEntity(reservationOrder);
    await this.repository.save(schema);
  }

  /**
   * Counts how many distinct equipment items are booked for a specific equipment type
   * during the given date range, considering buffer days.
   *
   * @param equipmentTypeId - The ID of the equipment type
   * @param startDate - The desired rental start date
   * @param endDate - The desired rental end date
   * @param bufferDays - Days of buffer to add before/after rental periods (default: 0)
   * @returns The number of distinct items that are unavailable
   */
  async getBookedItemsCount(
    equipmentTypeId: string,
    startDate: Date,
    endDate: Date,
    bufferDays: number = 0
  ): Promise<number> {
    // Convert dates to ISO strings for date comparison
    const startDateStr = this.toDateString(startDate);
    const endDateStr = this.toDateString(endDate);

    const result = await this.repository
      .createQueryBuilder("order")
      .innerJoin("order.items", "item")
      .innerJoin("item.item", "equipmentItem") // Join to EquipmentItem
      .where("equipmentItem.equipmentTypeId = :equipmentTypeId", {
        equipmentTypeId,
      })
      .andWhere("order.orderStatus IN (:...statuses)", {
        statuses: BLOCKING_ORDER_STATUSES,
      })
      .andWhere(
        `(
          DATE(order.expectedStartDate) <= DATE(:endDate) + INTERVAL ':bufferDays days'
          AND DATE(order.expectedEndDate) >= DATE(:startDate) - INTERVAL ':bufferDays days'
        )`,
        {
          startDate: startDateStr,
          endDate: endDateStr,
          bufferDays,
        }
      )
      .select("COUNT(DISTINCT item.itemId)", "count")
      .getRawOne();

    return parseInt(result.count, 10) || 0;
  }

  async findById(id: string): Promise<ReservationOrder | null> {
    const schema = await this.repository.findOne({
      where: { id },
    });

    return schema ? ReservationOrderMapper.toDomain(schema) : null;
  }

  /**
   * Helper to convert Date to YYYY-MM-DD string for date-only comparisons
   */
  private toDateString(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
