import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CreatePromotionCommand } from './create-promotion.command';
import { CreatePromotionRequestDto } from './create-promotion.request.dto';
import { CreatePromotionResponseDto } from './create-promotion.response.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/promotions')
export class CreatePromotionHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePromotionRequestDto,
  ): Promise<CreatePromotionResponseDto> {
    const id = await this.commandBus.execute(
      new CreatePromotionCommand(
        user.tenantId,
        dto.name,
        dto.type,
        dto.priority,
        dto.stackable,
        dto.condition,
        dto.effect,
        dto.target,
      ),
    );

    return { id };
  }
}
