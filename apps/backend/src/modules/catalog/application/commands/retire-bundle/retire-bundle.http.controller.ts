import { ConflictException, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { RetireBundleCommand } from './retire-bundle.command';
import { BundleAlreadyRetiredError, BundleNotFoundError } from '../../../domain/errors/catalog.errors';

@Controller('bundles')
export class RetireBundleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/retire')
  async retire(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new RetireBundleCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof BundleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BundleAlreadyRetiredError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
