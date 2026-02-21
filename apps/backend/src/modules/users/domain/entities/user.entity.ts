export class User {
  // 1. Private properties ensure encapsulation.
  // Naming convention: underscore prefix to distinguish from getters.
  private constructor(
    private readonly _id: string,
    private _email: string,
    private _passwordHash: string,
    private _firstName: string,
    private _lastName: string,
    private _isActive: boolean,
    private readonly _tenantId: string,
    private _roleId: string,
  ) {}

  // 2. Factory Method: The only way to create a NEW user.
  // Enforces business rules (invariants) at creation time.
  public static create(
    id: string,
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    tenantId: string,
    roleId: string,
  ): User {
    if (!email.includes('@')) {
      throw new Error('Invalid email format'); // Or a custom DomainException
    }

    return new User(id, email, passwordHash, firstName, lastName, true, tenantId, roleId);
  }

  public static reconstitute(
    id: string,
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    isActive: boolean,
    tenantId: string,
    roleId: string,
  ): User {
    return new User(id, email, passwordHash, firstName, lastName, isActive, tenantId, roleId);
  }

  get id(): string {
    return this._id;
  }
  get email(): string {
    return this._email;
  }
  get passwordHash(): string {
    return this._passwordHash;
  }
  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get roleId(): string {
    return this._roleId;
  }

  // Computed property (not in DB, but derived from domain)
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  // 4. Behavior Methods: How the state changes.
  // No `setEmail` or `setIsActive`! Use intention-revealing methods.

  public updateProfile(firstName: string, lastName: string): void {
    this._firstName = firstName;
    this._lastName = lastName;
    // In a real app, you might emit a domain event here:
    // this.addDomainEvent(new UserProfileUpdatedEvent(this.id));
  }

  public deactivate(): void {
    if (!this._isActive) {
      return;
    }
    this._isActive = false;
  }

  public activate(): void {
    if (this._isActive) {
      return;
    }
    this._isActive = true;
  }

  public changePassword(newHash: string): void {
    this._passwordHash = newHash;
  }
}
