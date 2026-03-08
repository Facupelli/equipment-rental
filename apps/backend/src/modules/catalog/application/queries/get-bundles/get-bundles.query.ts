export class GetBundlesQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly name?: string,
  ) {}
}
