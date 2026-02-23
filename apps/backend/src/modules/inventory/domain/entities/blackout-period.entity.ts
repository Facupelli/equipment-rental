import { DateRange } from '../value-objects/date-range.vo';

/**
 * Entity: BlackoutPeriod
 *
 * A child entity of the InventoryItem aggregate. It represents a named,
 * time-bounded window during which a specific inventory item is unavailable
 * for rental — due to maintenance, owner reservation, or any operational reason.
 *
 * This entity is intentionally unaware of PostgreSQL range types. It speaks
 * pure domain language: a `reason` string and a `DateRange` value object.
 * The translation to/from `tstzrange` is the Mapper's responsibility.
 */
export interface BlackoutPeriodProps {
  id: string;
  tenantId: string;
  inventoryItemId: string;
  reason: string;
  blockedPeriod: DateRange;
  createdAt: Date;
  updatedAt: Date;
}

export class BlackoutPeriod {
  readonly id: string;
  readonly tenantId: string;
  readonly inventoryItemId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private _reason: string;
  private _blockedPeriod: DateRange;

  private constructor(props: BlackoutPeriodProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.inventoryItemId = props.inventoryItemId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this._reason = props.reason;
    this._blockedPeriod = props.blockedPeriod;
  }

  static reconstitute(props: BlackoutPeriodProps): BlackoutPeriod {
    return new BlackoutPeriod(props);
  }

  static create(props: Omit<BlackoutPeriodProps, 'createdAt' | 'updatedAt'>): BlackoutPeriod {
    if (!props.reason || props.reason.trim().length === 0) {
      throw new Error('BlackoutPeriod must have a non-empty reason.');
    }

    return new BlackoutPeriod({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // --- Getters ---
  get reason(): string {
    return this._reason;
  }
  get blockedPeriod(): DateRange {
    return this._blockedPeriod;
  }

  // --- Behavior ---
  /**
   * Checks whether this blackout period conflicts with a requested rental window.
   * Delegates to the DateRange VO's overlap logic.
   */
  conflictsWith(requestedPeriod: DateRange): boolean {
    return this._blockedPeriod.overlaps(requestedPeriod);
  }

  /**
   * Updates the reason for this blackout period.
   * Returns a new instance to preserve immutability.
   */
  withReason(newReason: string): BlackoutPeriod {
    if (!newReason || newReason.trim().length === 0) {
      throw new Error('Reason cannot be empty.');
    }

    return BlackoutPeriod.reconstitute({
      ...this.toProps(),
      reason: newReason,
      updatedAt: new Date(),
    });
  }

  /**
   * Reschedules the blackout to a new period.
   * Returns a new instance to preserve immutability.
   */
  withPeriod(newPeriod: DateRange): BlackoutPeriod {
    return BlackoutPeriod.reconstitute({
      ...this.toProps(),
      blockedPeriod: newPeriod,
      updatedAt: new Date(),
    });
  }

  // --- Snapshot ---
  toProps(): BlackoutPeriodProps {
    return {
      id: this.id,
      tenantId: this.tenantId,
      inventoryItemId: this.inventoryItemId,
      reason: this._reason,
      blockedPeriod: this._blockedPeriod,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
