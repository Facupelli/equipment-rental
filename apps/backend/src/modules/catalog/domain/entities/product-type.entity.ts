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
    private categoryId: string | null,
    private billingUnitId: string,
    private name: string,
    private imageUrl: string,
    private description: string | null,
    private trackingMode: TrackingMode,
    private attributes: Record<string, unknown>,
    private includedItems: unknown[],
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

  get currentCategoryId(): string | null {
    return this.categoryId;
  }

  get currentBillingUnitId(): string {
    return this.billingUnitId;
  }

  get currentName(): string {
    return this.name;
  }

  get currentImageUrl(): string {
    return this.imageUrl;
  }

  get currentTrackingMode(): TrackingMode {
    return this.trackingMode;
  }

  get currentAttributes(): Record<string, unknown> {
    return this.attributes;
  }

  get currentIncludedItems(): unknown[] {
    return this.includedItems;
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

  update(
    props: Partial<Omit<CreateProductTypeProps, 'tenantId'>>,
  ): Result<void, InvalidProductTypeNameError | ProductTypeAlreadyRetiredError> {
    if (this.isRetired()) {
      return err(new ProductTypeAlreadyRetiredError());
    }

    if (props.name !== undefined) {
      if (props.name.trim().length === 0) {
        return err(new InvalidProductTypeNameError());
      }

      this.name = props.name.trim();
    }

    if (props.categoryId !== undefined) {
      this.categoryId = props.categoryId ?? null;
    }

    if (props.billingUnitId !== undefined) {
      this.billingUnitId = props.billingUnitId;
    }

    if (props.imageUrl !== undefined) {
      this.imageUrl = props.imageUrl;
    }

    if (props.description !== undefined) {
      this.description = props.description?.trim() ?? null;
    }

    if (props.trackingMode !== undefined) {
      this.trackingMode = props.trackingMode;
    }

    if (props.attributes !== undefined) {
      this.attributes = props.attributes ?? {};
    }

    if (props.includedItems !== undefined) {
      this.includedItems = props.includedItems ?? [];
    }

    return ok(undefined);
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
