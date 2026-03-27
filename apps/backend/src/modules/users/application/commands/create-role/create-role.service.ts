import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Role } from '../../../domain/entities/role.entity';
import { RoleRepository } from '../../../infrastructure/persistence/repositories/role.repository';
import { CreateRoleCommand } from './create-role.command';

@CommandHandler(CreateRoleCommand)
export class CreateRoleService implements ICommandHandler<CreateRoleCommand, string> {
  constructor(private readonly roleRepository: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<string> {
    const role = Role.create({
      code: command.code,
      name: command.name,
      description: command.description,
      tenantId: command.tenantId,
    });

    return await this.roleRepository.save(role);
  }
}
