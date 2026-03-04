import { randomUUID } from 'crypto';
import { InvalidProductCategoryNameException } from '../exceptions/product-category.exceptions';

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
    public readonly name: string,
    private description: string | null,
  ) {}

  static create(props: CreateProductCategoryProps): ProductCategory {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidProductCategoryNameException();
    }
    return new ProductCategory(randomUUID(), props.tenantId, props.name.trim(), props.description?.trim() ?? null);
  }

  static reconstitute(props: ReconstituteProductCategoryProps): ProductCategory {
    return new ProductCategory(props.id, props.tenantId, props.name, props.description);
  }

  get currentDescription(): string | null {
    return this.description;
  }

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }
}
