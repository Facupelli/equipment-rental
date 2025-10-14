import { Entity } from "src/shared/domain/base-entity";
import { CategoryId } from "../value-objects/category-id.vo";
import { EquipmentTypeId } from "../value-objects/equipment-type-id.vo";

export class EquipmentType extends Entity<string> {
  private _name: string;
  private _description: string;
  private _categoryId: CategoryId;

  private constructor(
    id: EquipmentTypeId,
    name: string,
    description: string,
    categoryId: CategoryId
  ) {
    super(id.value);
    this._name = name;
    this._description = description;
    this._categoryId = categoryId;
  }

  /* ---------- factory ---------- */
  public static create(
    id: EquipmentTypeId,
    name: string,
    description: string,
    categoryId: CategoryId
  ): EquipmentType {
    if (!name.trim()) {
      throw new Error("EquipmentType name required");
    }
    return new EquipmentType(id, name, description, categoryId);
  }

  /* ---------- getters ---------- */
  public get equipmentTypeId(): EquipmentTypeId {
    return EquipmentTypeId.fromString(this._id);
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string {
    return this._description;
  }
  public get categoryId(): CategoryId {
    return this._categoryId;
  }
}
