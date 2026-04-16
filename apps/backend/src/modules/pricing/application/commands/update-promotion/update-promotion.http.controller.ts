import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Param, Put } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { PromotionNotFoundError } from '../../../domain/errors/pricing.errors';
import { UpdatePromotionCommand } from './update-promotion.command';
import { UpdatePromotionRequestDto } from './update-promotion.request.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/promotions')
export class UpdatePromotionHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdatePromotionCommand(
        user.tenantId,
        id,
        dto.name,
        dto.activationType,
        dto.priority,
        dto.stackingType,
        dto.validFrom,
        dto.validUntil,
        dto.conditions,
        dto.applicability,
        dto.effect,
      ),
    );

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof PromotionNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
