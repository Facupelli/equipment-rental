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
  imageUrl: string;
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
  imageUrl: string;
  description: string | null;
  trackingMode: TrackingMode;
  attributes: Record<string, unknown>;
  includedItems: unknown[];
  publishedAt: Date | null;
  retiredAt: Date | null;
}

export class ProductType {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly categoryId: string | null,
    public readonly billingUnitId: string,
    public readonly name: string,
    public readonly imageUrl: string,
    private description: string | null,
    public readonly trackingMode: TrackingMode,
    public readonly attributes: Record<string, unknown>,
    public readonly includedItems: unknown[],
    private publishedAt: Date | null,
    private retiredAt: Date | null,
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
      props.imageUrl,
      props.description?.trim() ?? null,
      props.trackingMode,
      props.attributes ?? {},
      props.includedItems ?? [],
      null, // starts as draft
      null,
    );
  }

  static reconstitute(props: ReconstituteProductTypeProps): ProductType {
    return new ProductType(
      props.id,
      props.tenantId,
      props.categoryId,
      props.billingUnitId,
      props.name,
      props.imageUrl,
      props.description,
      props.trackingMode,
      props.attributes,
      props.includedItems,
      props.publishedAt,
      props.retiredAt,
    );
  }

  // --- Queries ---

  get currentDescription(): string | null {
    return this.description;
  }

  getPublishedAt(): Date | null {
    return this.publishedAt;
  }

  getRetiredAt(): Date | null {
    return this.retiredAt;
  }

  isPublished(): boolean {
    return this.publishedAt !== null;
  }

  isRetired(): boolean {
    return this.retiredAt !== null;
  }

  isAvailableForBooking(): boolean {
    return this.isPublished() && !this.isRetired();
  }

  // --- Commands ---

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }

  publish(): void {
    if (this.isRetired()) {
      throw new ProductTypeAlreadyRetiredException();
    }
    if (this.isPublished()) {
      throw new ProductTypeAlreadyPublishedException();
    }
    this.publishedAt = new Date();
  }

  retire(): void {
    if (this.isRetired()) {
      throw new ProductTypeAlreadyRetiredException();
    }
    this.retiredAt = new Date();
  }
}
