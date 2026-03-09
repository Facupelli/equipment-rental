import { randomUUID } from 'crypto';
import {
  InvalidProductTypeNameException,
  ProductTypeAlreadyRetiredException,
  ProductTypeAlreadyPublishedException,
} from '../exceptions/product-type.exceptions';
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
  attributes: Record<string, unknown>;
  includedItems: unknown[];
  isPublished: boolean;
  isRetired: boolean;
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
    public readonly attributes: Record<string, unknown>,
    public readonly includedItems: unknown[],
    private published: boolean,
    private retired: boolean,
  ) {}

  // --- Factories ---

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
      props.attributes ?? {},
      props.includedItems ?? [],
      false, // starts as draft
      false,
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
      props.attributes,
      props.includedItems,
      props.isPublished,
      props.isRetired,
    );
  }

  // --- Queries ---

  get currentDescription(): string | null {
    return this.description;
  }

  isPublished(): boolean {
    return this.published;
  }

  isRetired(): boolean {
    return this.retired;
  }

  isAvailableForBooking(): boolean {
    return this.published && !this.retired;
  }

  // --- Commands ---

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }

  publish(): void {
    if (this.retired) throw new ProductTypeAlreadyRetiredException();
    if (this.published) throw new ProductTypeAlreadyPublishedException();
    this.published = true;
  }

  retire(): void {
    if (this.retired) throw new ProductTypeAlreadyRetiredException();
    this.retired = true;
  }
}
