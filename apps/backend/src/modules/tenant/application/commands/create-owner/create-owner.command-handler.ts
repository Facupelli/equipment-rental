import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOwnerCommand } from './create-owner.command';
import { ok, Result } from 'src/core/result';
import { Owner } from 'src/modules/tenant/domain/entities/owner.entity';
import { OwnerRepositoryPort } from 'src/modules/tenant/domain/ports/owner.repository.port';
import { TenantContextService } from '../../tenant-context.service';

@CommandHandler(CreateOwnerCommand)
export class CreateOwnerCommandHandler implements ICommandHandler<CreateOwnerCommand, Result<string>> {
  constructor(
    private readonly ownerRepo: OwnerRepositoryPort,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(command: CreateOwnerCommand): Promise<Result<string>> {
    const tenantId = this.tenantContext.requireTenantId();

    const owner = Owner.create({
      tenantId,
      name: command.name,
      email: command.email,
      phone: command.phone,
      notes: command.notes,
    });

    await this.ownerRepo.save(owner);

    return ok(owner.id);
  }
}
