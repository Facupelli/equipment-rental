import { BadRequestException } from '@nestjs/common';

export class Tenant {
  private constructor(
    private readonly _id: string,
    private _name: string,
    private _slug: string,
    private _planTier: string,
    private _isActive: boolean,
    private readonly _createdAt: Date,
  ) {}

  public static create(id: string, name: string, slug: string, planTier: string): Tenant {
    if (!slug.match(/^[a-z0-9-]+$/)) {
      throw new BadRequestException('Slug must be lowercase alphanumeric with hyphens only');
    }
    return new Tenant(id, name, slug, planTier, true, new Date());
  }

  public static reconstitute(
    id: string,
    name: string,
    slug: string,
    planTier: string,
    isActive: boolean,
    createdAt: Date,
  ): Tenant {
    return new Tenant(id, name, slug, planTier, isActive, createdAt);
  }

  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get slug(): string {
    return this._slug;
  }
  get planTier(): string {
    return this._planTier;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}
