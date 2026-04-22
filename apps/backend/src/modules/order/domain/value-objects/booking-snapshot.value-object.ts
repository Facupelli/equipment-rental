export interface BookingSnapshotProps {
  pickupDate: string;
  pickupTime: number;
  returnDate: string;
  returnTime: number;
  timezone: string;
}

export class BookingSnapshot {
  public readonly pickupDate: string;
  public readonly pickupTime: number;
  public readonly returnDate: string;
  public readonly returnTime: number;
  public readonly timezone: string;

  private constructor(props: BookingSnapshotProps) {
    this.pickupDate = props.pickupDate;
    this.pickupTime = props.pickupTime;
    this.returnDate = props.returnDate;
    this.returnTime = props.returnTime;
    this.timezone = props.timezone;
  }

  static create(props: BookingSnapshotProps): BookingSnapshot {
    return new BookingSnapshot(props);
  }

  static reconstitute(props: BookingSnapshotProps): BookingSnapshot {
    return new BookingSnapshot(props);
  }

  static fromJSON(raw: unknown): BookingSnapshot {
    const data = raw as Record<string, unknown>;

    return new BookingSnapshot({
      pickupDate: data.pickupDate as string,
      pickupTime: data.pickupTime as number,
      returnDate: data.returnDate as string,
      returnTime: data.returnTime as number,
      timezone: data.timezone as string,
    });
  }

  toJSON(): object {
    return {
      pickupDate: this.pickupDate,
      pickupTime: this.pickupTime,
      returnDate: this.returnDate,
      returnTime: this.returnTime,
      timezone: this.timezone,
    };
  }

  equals(other: BookingSnapshot): boolean {
    return (
      this.pickupDate === other.pickupDate &&
      this.pickupTime === other.pickupTime &&
      this.returnDate === other.returnDate &&
      this.returnTime === other.returnTime &&
      this.timezone === other.timezone
    );
  }
}
