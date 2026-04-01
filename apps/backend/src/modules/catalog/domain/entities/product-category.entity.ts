import { randomUUID } from 'crypto';
import { Result, err, ok } from 'neverthrow';
import { InvalidProductCategoryNameError } from '../errors/catalog.errors';

export interface CreateProductCategoryProps {
  tenantId: string;
  name: string;
  description: string | null;
}

export interface ReconstituteProductCategoryProps {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
}

export class ProductCategory {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private name: string,
    private description: string | null,
  ) {}

  static create(props: CreateProductCategoryProps): Result<ProductCategory, InvalidProductCategoryNameError> {
    if (!props.name || props.name.trim().length === 0) {
      return err(new InvalidProductCategoryNameError());
    }
    return ok(new ProductCategory(randomUUID(), props.tenantId, props.name.trim(), props.description?.trim() ?? null));
  }

  static reconstitute(props: ReconstituteProductCategoryProps): ProductCategory {
    return new ProductCategory(props.id, props.tenantId, props.name, props.description);
  }

  get currentDescription(): string | null {
    return this.description;
  }

  get currentName(): string {
    return this.name;
  }

  update(props: { name?: string; description?: string | null }): Result<void, InvalidProductCategoryNameError> {
    if (props.name !== undefined) {
      if (props.name.trim().length === 0) {
        return err(new InvalidProductCategoryNameError());
      }

      this.name = props.name.trim();
    }

    if (props.description !== undefined) {
      this.description = props.description?.trim() ?? null;
    }

    return ok(undefined);
  }

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }
}
