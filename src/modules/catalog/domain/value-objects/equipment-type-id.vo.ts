import { ValueObject } from "src/shared/domain/value-object";

export class EquipmentTypeId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  public static fromString(value: string): EquipmentTypeId {
    if (!value) throw new Error("EquipmentTypeId cannot be empty");
    return new EquipmentTypeId(value);
  }

  public get value(): string {
    return this.props.value;
  }
}
