import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { DuplicateRoleAssignmentError, UserInactiveError } from '../../../domain/errors/users.errors';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../infrastructure/persistence/repositories/user.repository';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserService implements ICommandHandler<
  CreateUserCommand,
  Result<string, UserInactiveError | DuplicateRoleAssignmentError>
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: CreateUserCommand): Promise<Result<string, UserInactiveError | DuplicateRoleAssignmentError>> {
    const user = User.create({
      email: command.email,
      passwordHash: command.passwordHash,
      firstName: command.firstName,
      lastName: command.lastName,
      tenantId: command.tenantId,
    });

    const assignRoleResult = user.assignRole({
      roleId: command.roleId,
      userId: user.id,
    });

    if (assignRoleResult.isErr()) {
      return err(assignRoleResult.error);
    }

    await this.userRepository.save(user);

    return ok(user.id);
  }
}
