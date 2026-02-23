import { randomUUID } from 'node:crypto';

export class Owner {
  private readonly _id: string;
  private readonly _tenantId: string;
  private _name: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, tenantId: string, name: string, createdAt: Date, updatedAt: Date) {
    this._id = id;
    this._tenantId = tenantId;
    this._name = name;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(name: string, tenantId: string): Owner {
    const id = randomUUID();
    const now = new Date();
    return new Owner(id, tenantId, name, now, now);
  }

  static reconstitute(id: string, tenantId: string, name: string, createdAt: Date, updatedAt: Date): Owner {
    return new Owner(id, tenantId, name, createdAt, updatedAt);
  }

  // Business Logic: Behavior
  public updateProfile(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get name(): string {
    return this._name;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
