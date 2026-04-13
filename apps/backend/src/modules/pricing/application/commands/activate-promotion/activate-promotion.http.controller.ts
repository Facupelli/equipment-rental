import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { PromotionNotFoundError } from '../../../domain/errors/pricing.errors';
import { ActivatePromotionCommand } from './activate-promotion.command';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/promotions')
export class ActivatePromotionHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    const result = await this.commandBus.execute(new ActivatePromotionCommand(user.tenantId, id));

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof PromotionNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
