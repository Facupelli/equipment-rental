import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOwnerCommand } from './create-owner.command';
import { ok, Result } from 'src/core/result';
import { Owner } from 'src/modules/tenant/domain/entities/owner.entity';
import { OwnerRepositoryPort } from 'src/modules/tenant/domain/ports/owner.repository.port';

@CommandHandler(CreateOwnerCommand)
export class CreateOwnerCommandHandler implements ICommandHandler<CreateOwnerCommand, Result<string>> {
  constructor(private readonly ownerRepo: OwnerRepositoryPort) {}

  async execute(command: CreateOwnerCommand): Promise<Result<string>> {
    const owner = Owner.create({
      tenantId: command.tenantId,
      name: command.name,
      email: command.email,
      phone: command.phone,
      notes: command.notes,
    });

    await this.ownerRepo.save(owner);

    return ok(owner.id);
  }
}
