export class InvalidProductTypeNameException extends Error {
  constructor() {
    super('Product type name cannot be empty.');
    this.name = 'InvalidProductTypeNameException';
  }
}
