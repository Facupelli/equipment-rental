import { randomUUID } from 'node:crypto';

export interface AddressProps {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: { lat: number; lng: number };
}

export class Location {
  private readonly _id: string;
  private readonly _tenantId: string;
  private _name: string;
  private _address: AddressProps;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    tenantId: string,
    name: string,
    address: AddressProps,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._id = id;
    this._tenantId = tenantId;
    this._name = name;
    this._address = address;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(name: string, address: AddressProps, tenantId: string): Location {
    const id = randomUUID();
    const now = new Date();
    return new Location(id, tenantId, name, address, true, now, now);
  }

  static reconstitute(
    id: string,
    tenantId: string,
    name: string,
    address: AddressProps,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): Location {
    return new Location(id, tenantId, name, address, isActive, createdAt, updatedAt);
  }

  // Business Logic: Behavior
  public updateDetails(name: string, address: AddressProps): void {
    this._name = name;
    this._address = address;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  // Getters (Read-only access to state)
  get id(): string {
    return this._id;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get name(): string {
    return this._name;
  }

  get address(): AddressProps {
    return this._address;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
