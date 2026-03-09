import { randomUUID } from 'crypto';
import { InvalidProductTypeNameException } from '../exceptions/product-type.exceptions';
import { TrackingMode } from '@repo/types';

export interface IncludedItem {
  name: string;
  quantity: number;
  notes: string | null;
}

export interface CreateProductTypeProps {
  tenantId: string;
  categoryId: string | null;
  billingUnitId: string;
  name: string;
  description: string | null;
  trackingMode: TrackingMode;
  attributes: Record<string, unknown> | null;
  includedItems: IncludedItem[] | null;
}

export interface ReconstituteProductTypeProps {
  id: string;
  tenantId: string;
  categoryId: string | null;
  billingUnitId: string;
  name: string;
  description: string | null;
  trackingMode: TrackingMode;
  isActive: boolean;
  attributes: Record<string, unknown>;
  includedItems: unknown[];
}

export class ProductType {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly categoryId: string | null,
    public readonly billingUnitId: string,
    public readonly name: string,
    private description: string | null,
    public readonly trackingMode: TrackingMode,
    private isActive: boolean,
    public readonly attributes: Record<string, unknown>,
    public readonly includedItems: unknown[],
  ) {}

  static create(props: CreateProductTypeProps): ProductType {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidProductTypeNameException();
    }
    return new ProductType(
      randomUUID(),
      props.tenantId,
      props.categoryId ?? null,
      props.billingUnitId,
      props.name.trim(),
      props.description?.trim() ?? null,
      props.trackingMode,
      true,
      props.attributes ?? {},
      props.includedItems ?? [],
    );
  }

  static reconstitute(props: ReconstituteProductTypeProps): ProductType {
    return new ProductType(
      props.id,
      props.tenantId,
      props.categoryId,
      props.billingUnitId,
      props.name,
      props.description,
      props.trackingMode,
      props.isActive,
      props.attributes,
      props.includedItems,
    );
  }

  get active(): boolean {
    return this.isActive;
  }

  get currentDescription(): string | null {
    return this.description;
  }

  deactivate(): void {
    this.isActive = false;
  }

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }
}
