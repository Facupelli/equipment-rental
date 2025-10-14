import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Reservation,
  ReservationStatus,
} from "../../../domain/entities/reservation.entity";
import { ReservationId } from "../../../domain/value-objects/reservation-id.vo";
import { TimeRange } from "../../../domain/value-objects/time-range.vo";
import { ReservationSchema } from "./reservation.schema";

/**
 * Repository Implementation (Adapter)
 *
 * Responsibilities:
 * - Map between domain entities and persistence schemas
 * - Implement data access logic
 * - Hide TypeORM details from domain layer
 */
@Injectable()
// export class ReservationRepository implements IReservationRepository {
export class ReservationRepository {
  constructor(
    @InjectRepository(ReservationSchema)
    private readonly repository: Repository<ReservationSchema>
  ) {}

  async save(reservation: Reservation): Promise<void> {
    const schema = this.toSchema(reservation);
    await this.repository.save(schema);
  }

  async findById(id: ReservationId): Promise<Reservation | null> {
    const schema = await this.repository.findOne({
      where: { id: id.value },
    });

    return schema ? this.toDomain(schema) : null;
  }

  async findOverlapping(
    equipmentTypeId: string,
    startDateTime: Date,
    endDateTime: Date,
    statuses: ReservationStatus[]
  ): Promise<Reservation[]> {
    // Critical query for availability checking
    // Uses indexed columns for performance
    const schemas = await this.repository
      .createQueryBuilder("reservation")
      .where("reservation.equipment_type_id = :equipmentTypeId", {
        equipmentTypeId,
      })
      .andWhere("reservation.status IN (:...statuses)", { statuses })
      .andWhere("reservation.start_datetime < :endDateTime", { endDateTime })
      .andWhere("reservation.end_datetime > :startDateTime", { startDateTime })
      .getMany();

    return schemas.map((schema) => this.toDomain(schema));
  }

  async findByCustomer(
    customerId: string,
    limit = 50,
    offset = 0
  ): Promise<Reservation[]> {
    const schemas = await this.repository.find({
      where: { customer_id: customerId },
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return schemas.map((schema) => this.toDomain(schema));
  }

  async delete(id: ReservationId): Promise<void> {
    await this.repository.delete({ id: id.value });
  }

  // ============================================
  // MAPPERS: Schema ↔ Domain
  // ============================================

  /**
   * Map from Domain Entity to Persistence Schema
   */
  private toSchema(reservation: Reservation): ReservationSchema {
    const schema = new ReservationSchema();

    schema.id = reservation.id.value;
    schema.customer_id = reservation.customerId;
    schema.equipment_type_id = reservation.equipmentTypeId;
    schema.start_datetime = reservation.startDateTime;
    schema.end_datetime = reservation.endDateTime;
    schema.quantity = reservation.quantity;
    schema.status = reservation.status;
    schema.quoted_price = reservation.quotedPrice;
    schema.notes = reservation.notes;
    schema.created_at = reservation.createdAt;
    schema.updated_at = reservation.updatedAt;

    return schema;
  }

  /**
   * Map from Persistence Schema to Domain Entity
   */
  private toDomain(schema: ReservationSchema): Reservation {
    const timeRangeResult = TimeRange.create(
      schema.start_datetime,
      schema.end_datetime
    );

    if (timeRangeResult.isFailure) {
      throw new Error(
        `Invalid time range in persisted reservation: ${schema.id}`
      );
    }

    const reservationResult = Reservation.create(
      {
        customerId: schema.customer_id,
        equipmentTypeId: schema.equipment_type_id,
        timeRange: timeRangeResult.value,
        quantity: schema.quantity,
        status: schema.status as ReservationStatus,
        quotedPrice: schema.quoted_price,
        notes: schema.notes,
      },
      ReservationId.create(schema.id)
    );

    if (reservationResult.isFailure) {
      throw new Error(`Invalid reservation data: ${reservationResult.error}`);
    }

    return reservationResult.value;
  }
}
