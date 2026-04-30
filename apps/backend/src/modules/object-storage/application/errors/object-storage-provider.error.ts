export type ObjectStorageOperation = 'putObject' | 'getObjectBuffer' | 'getObjectStream';

export class ObjectStorageProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly operation: ObjectStorageOperation,
    public readonly target: string,
    message: string,
  ) {
    super(message);
    this.name = 'ObjectStorageProviderError';
  }
}
