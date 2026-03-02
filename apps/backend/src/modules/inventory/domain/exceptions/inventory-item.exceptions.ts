export class InvalidInventoryItemException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInventoryItemException';
  }
}
