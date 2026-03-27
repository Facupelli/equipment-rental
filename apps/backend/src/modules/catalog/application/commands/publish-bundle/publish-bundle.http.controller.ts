import { ConflictException, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { PublishBundleCommand } from './publish-bundle.command';
import {
  BundleAlreadyPublishedError,
  BundleAlreadyRetiredError,
  BundleNotFoundError,
} from '../../../domain/errors/catalog.errors';

@Controller('bundles')
export class PublishBundleHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/publish')
  async publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new PublishBundleCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof BundleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BundleAlreadyPublishedError || error instanceof BundleAlreadyRetiredError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
