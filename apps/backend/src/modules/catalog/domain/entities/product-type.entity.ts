import { randomUUID } from 'crypto';
import { TrackingMode } from '@repo/types';
import { Result, err, ok } from 'neverthrow';
import {
  InvalidProductTypeNameError,
  ProductTypeAlreadyPublishedError,
  ProductTypeAlreadyRetiredError,
} from '../errors/catalog.errors';

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

  static create(props: CreateProductTypeProps): Result<ProductType, InvalidProductTypeNameError> {
    if (!props.name || props.name.trim().length === 0) {
      return err(new InvalidProductTypeNameError());
    }
    return ok(
      new ProductType(
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
      ),
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

  publish(): Result<void, ProductTypeAlreadyRetiredError | ProductTypeAlreadyPublishedError> {
    if (this.isRetired()) {
      return err(new ProductTypeAlreadyRetiredError());
    }
    if (this.isPublished()) {
      return err(new ProductTypeAlreadyPublishedError());
    }
    this.publishedAt = new Date();
    return ok(undefined);
  }

  retire(): Result<void, ProductTypeAlreadyRetiredError> {
    if (this.isRetired()) {
      return err(new ProductTypeAlreadyRetiredError());
    }
    this.retiredAt = new Date();
    return ok(undefined);
  }
}
