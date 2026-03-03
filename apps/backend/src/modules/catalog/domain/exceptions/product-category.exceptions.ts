export class InvalidProductCategoryNameException extends Error {
  constructor() {
    super('Product category name cannot be empty.');
    this.name = 'InvalidProductCategoryNameException';
  }
}
