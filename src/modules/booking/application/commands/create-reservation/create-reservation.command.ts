import { ICommand } from "@nestjs/cqrs";

export class CreateReservationCommand implements ICommand {
  constructor(
    public readonly customerId: string,
    public readonly equipmentTypeId: string,
    public readonly startDateTime: Date,
    public readonly endDateTime: Date,
    public readonly quantity: number,
    public readonly notes?: string
  ) {}
}
