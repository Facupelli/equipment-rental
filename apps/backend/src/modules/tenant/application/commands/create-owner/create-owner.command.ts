export class CreateOwnerCommand {
  constructor(
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly notes: string | null,
  ) {}
}
