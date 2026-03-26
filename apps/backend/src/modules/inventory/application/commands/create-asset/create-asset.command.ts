import { ICommand } from '@nestjs/cqrs';

export class CreateAssetCommand implements ICommand {
  constructor(
    public readonly locationId: string,
    public readonly productTypeId: string,
    public readonly ownerId: string | null,
    public readonly serialNumber: string | null,
    public readonly notes: string | null,
  ) {}
}
