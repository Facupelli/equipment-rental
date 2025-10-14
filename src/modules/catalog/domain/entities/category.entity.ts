import { Entity } from "src/shared/domain/base-entity";
import { CategoryId } from "../value-objects/category-id.vo";

export class Category extends Entity<string> {
  private _name: string;
  private _parentId: CategoryId | null;
  private _description: string;

  private constructor(
    id: CategoryId,
    name: string,
    description: string,
    parentId: CategoryId | null
  ) {
    super(id.value); // base Entity wants the raw id
    this._name = name;
    this._description = description;
    this._parentId = parentId;
  }

  /* ---------- factory ---------- */
  public static create(
    id: CategoryId,
    name: string,
    description: string,
    parentId: CategoryId | null = null
  ): Category {
    if (!name.trim()) {
      throw new Error("Category name required");
    }
    return new Category(id, name, description, parentId);
  }

  /* ---------- getters (read-only surface) ---------- */
  public get categoryId(): CategoryId {
    return CategoryId.fromString(this._id);
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string {
    return this._description;
  }
  public get parentId(): CategoryId | null {
    return this._parentId;
  }

  /* ---------- behaviour ---------- */
  public rename(newName: string): void {
    if (!newName.trim()) {
      throw new Error("Category name cannot be empty");
    }
    this._name = newName;
  }
}
