import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOwnerCommand } from './create-owner.command';
import { Owner } from '../../../domain/entities/owner.entity';
import { OwnerRepository } from '../../../infrastructure/persistence/repositories/owner.repository';

@CommandHandler(CreateOwnerCommand)
export class CreateOwnerCommandHandler implements ICommandHandler<CreateOwnerCommand, string> {
  constructor(private readonly ownerRepo: OwnerRepository) {}

  async execute(command: CreateOwnerCommand): Promise<string> {
    const owner = Owner.create({
      tenantId: command.tenantId,
      name: command.name,
      email: command.email,
      phone: command.phone,
      notes: command.notes,
    });

    await this.ownerRepo.save(owner);

    return owner.id;
  }
}
