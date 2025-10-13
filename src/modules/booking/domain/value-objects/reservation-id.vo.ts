import { randomUUID } from "node:crypto";
import { ValueObject } from "../../../../shared/domain/value-object";

interface ReservationIdProps {
  value: string;
}

export class ReservationId extends ValueObject<ReservationIdProps> {
  private constructor(props: ReservationIdProps) {
    super(props);
  }

  public static create(id?: string): ReservationId {
    return new ReservationId({ value: id || randomUUID() });
  }

  public get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
