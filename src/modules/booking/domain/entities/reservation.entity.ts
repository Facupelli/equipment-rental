// src/modules/booking/domain/entities/reservation.entity.ts

import { Entity } from "../../../../shared/domain/base-entity";
import { Result } from "../../../../shared/domain/result";
import { ReservationId } from "../value-objects/reservation-id.vo";
import { TimeRange } from "../value-objects/time-range.vo";

export enum ReservationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

interface ReservationProps {
  customerId: string;
  equipmentTypeId: string;
  timeRange: TimeRange;
  quantity: number;
  status: ReservationStatus;
  quotedPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reservation Domain Entity
 * Represents customer's intent to rent equipment
 *
 * Business Rules:
 * - Quantity must be positive
 * - Time range must be valid (end after start)
 * - Can only cancel pending or confirmed reservations
 * - Can only confirm pending reservations
 */
export class Reservation extends Entity<ReservationId> {
  private props: ReservationProps;

  private constructor(id: ReservationId, props: ReservationProps) {
    super(id);
    this.props = props;
  }

  // Factory method with validation
  public static create(
    props: Omit<ReservationProps, "createdAt" | "updatedAt">,
    id?: ReservationId
  ): Result<Reservation> {
    // Business rule: quantity must be positive
    if (props.quantity <= 0) {
      return Result.fail("Quantity must be positive");
    }

    // Business rule: time range must be valid
    if (!props.timeRange.isValid()) {
      return Result.fail("Invalid time range: end must be after start");
    }

    const reservationId = id || ReservationId.create();
    const now = new Date();

    const reservation = new Reservation(reservationId, {
      ...props,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(reservation);
  }

  // Getters
  public get customerId(): string {
    return this.props.customerId;
  }

  public get equipmentTypeId(): string {
    return this.props.equipmentTypeId;
  }

  public get timeRange(): TimeRange {
    return this.props.timeRange;
  }

  public get startDateTime(): Date {
    return this.props.timeRange.start;
  }

  public get endDateTime(): Date {
    return this.props.timeRange.end;
  }

  public get quantity(): number {
    return this.props.quantity;
  }

  public get status(): ReservationStatus {
    return this.props.status;
  }

  public get quotedPrice(): number | undefined {
    return this.props.quotedPrice;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods

  public confirm(price: number): Result<void> {
    if (this.props.status !== ReservationStatus.PENDING) {
      return Result.fail("Can only confirm pending reservations");
    }

    this.props.status = ReservationStatus.CONFIRMED;
    this.props.quotedPrice = price;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  public cancel(reason?: string): Result<void> {
    if (
      this.props.status !== ReservationStatus.PENDING &&
      this.props.status !== ReservationStatus.CONFIRMED
    ) {
      return Result.fail("Can only cancel pending or confirmed reservations");
    }

    this.props.status = ReservationStatus.CANCELLED;
    this.props.notes = reason || this.props.notes;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  public complete(): Result<void> {
    if (this.props.status !== ReservationStatus.CONFIRMED) {
      return Result.fail("Can only complete confirmed reservations");
    }

    this.props.status = ReservationStatus.COMPLETED;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  public isPending(): boolean {
    return this.props.status === ReservationStatus.PENDING;
  }

  public isConfirmed(): boolean {
    return this.props.status === ReservationStatus.CONFIRMED;
  }

  public isCancelled(): boolean {
    return this.props.status === ReservationStatus.CANCELLED;
  }

  public isCompleted(): boolean {
    return this.props.status === ReservationStatus.COMPLETED;
  }
}
