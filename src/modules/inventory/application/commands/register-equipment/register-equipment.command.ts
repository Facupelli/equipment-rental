export class RegisterEquipmentCommand {
  constructor(
    public readonly equipmentTypeId: string,
    public readonly serialNumber: string
  ) {}
}
