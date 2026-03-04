export class CreateLocationCommand {
  constructor(
    public readonly name: string,
    public readonly address: string | null,
  ) {}
}
