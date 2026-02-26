import { randomUUID } from 'node:crypto';

export interface CategoryProps {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCategoryProps = Omit<CategoryProps, 'id' | 'createdAt' | 'updatedAt'>;

export class Category {
  private readonly _id: string;
  private readonly _tenantId: string;
  private _name: string;
  private _description: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: CategoryProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._name = props.name;
    this._description = props.description;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateCategoryProps): Category {
    if (!props.name.trim()) {
      throw new Error('Category name cannot be empty.');
    }

    const now = new Date();

    return new Category({
      id: randomUUID(),
      tenantId: props.tenantId,
      name: props.name.trim(),
      description: props.description,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  // --- Behavior ---

  public updateDetails(name: string, description: string | null): void {
    if (!name.trim()) {
      throw new Error('Category name cannot be empty.');
    }

    this._name = name.trim();
    this._description = description;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | null {
    return this._description;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
