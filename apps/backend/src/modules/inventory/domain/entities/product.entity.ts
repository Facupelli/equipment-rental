import { TrackingType } from '@repo/types';
import { randomUUID } from 'node:crypto';

export interface ProductProps {
  id: string;
  tenantId: string;
  name: string;
  trackingType: TrackingType;
  baseRentalPrice: number;
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductProps = Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>;

export class Product {
  private readonly id: string;
  private readonly tenantId: string;
  // Business State (Mutable)
  private _name: string;
  private _baseRentalPrice: number;
  private _attributes: Record<string, any>;
  // Immutable classification
  private readonly trackingType: TrackingType;
  // Audit timestamps
  private readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this._name = props.name;
    this.trackingType = props.trackingType;
    this._baseRentalPrice = props.baseRentalPrice;
    this._attributes = props.attributes;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateProductProps): Product {
    const id = randomUUID();
    const now = new Date();

    // Invariant: Price cannot be negative
    if (props.baseRentalPrice < 0) {
      throw new Error('Base rental price cannot be negative');
    }

    return new Product({
      id,
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  // --- Behavior Methods (Business Logic) ---
  public updateDetails(name: string, attributes: Record<string, any>): void {
    this._name = name;
    this._attributes = attributes;
    this._updatedAt = new Date();
  }

  public updateBasePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Base rental price cannot be negative');
    }
    this._baseRentalPrice = newPrice;
    this._updatedAt = new Date();
  }

  // --- Getters (Read-Only Access) ---
  get Id(): string {
    return this.id;
  }

  get TenantId(): string {
    return this.tenantId;
  }

  get Name(): string {
    return this._name;
  }

  get TrackingType(): TrackingType {
    return this.trackingType;
  }

  get BaseRentalPrice(): number {
    return this._baseRentalPrice;
  }

  get Attributes(): Record<string, any> {
    return this._attributes;
  }

  get CreatedAt(): Date {
    return this.createdAt;
  }

  get UpdatedAt(): Date {
    return this._updatedAt;
  }
}
