export class CreateLocationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly address: string | null,
  ) {}
}
