export class Role {
  private constructor(
    private readonly _id: string,
    private readonly _tenantId: string,
    private _name: string,
    private _isSystem: boolean,
    private _description: string | null,
  ) {}

  public static create(id: string, tenantId: string, name: string, description: string | null = null): Role {
    return new Role(id, tenantId, name, false, description);
  }

  public static reconstitute(
    id: string,
    tenantId: string,
    name: string,
    isSystem: boolean,
    description: string | null,
  ): Role {
    return new Role(id, tenantId, name, isSystem, description);
  }

  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get name(): string {
    return this._name;
  }
  get isSystem(): boolean {
    return this._isSystem;
  }
  get description(): string | null {
    return this._description;
  }
}
