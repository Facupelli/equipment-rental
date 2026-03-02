export class InvalidProductBundleException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProductBundleException';
  }
}
