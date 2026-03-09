export class InvalidProductTypeNameException extends Error {
  constructor() {
    super('Product type name cannot be empty.');
    this.name = 'InvalidProductTypeNameException';
  }
}

export class ProductTypeAlreadyRetiredException extends Error {
  constructor() {
    super('This product type is already retired.');
    this.name = 'ProductTypeAlreadyRetiredException';
  }
}

export class ProductTypeAlreadyPublishedException extends Error {
  constructor() {
    super('This product type is already published.');
    this.name = 'ProductTypeAlreadyPublishedException';
  }
}
