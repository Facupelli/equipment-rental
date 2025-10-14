import { ValueObject } from "src/shared/domain/value-object";

export class CategoryId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  public static fromString(value: string): CategoryId {
    if (!value) throw new Error("CategoryId cannot be empty");
    return new CategoryId(value);
  }

  public get value(): string {
    return this.props.value;
  }
}
