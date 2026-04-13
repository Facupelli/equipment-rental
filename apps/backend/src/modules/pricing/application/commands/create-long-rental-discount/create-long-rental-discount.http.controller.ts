import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CreateLongRentalDiscountCommand } from './create-long-rental-discount.command';
import { CreateLongRentalDiscountRequestDto } from './create-long-rental-discount.request.dto';
import { CreateLongRentalDiscountResponseDto } from './create-long-rental-discount.response.dto';

@StaffRoute(Permission.MANAGE_PRICING)
@Controller('pricing/long-rental-discounts')
export class CreateLongRentalDiscountHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLongRentalDiscountRequestDto,
  ): Promise<CreateLongRentalDiscountResponseDto> {
    const id = await this.commandBus.execute(
      new CreateLongRentalDiscountCommand(user.tenantId, dto.name, dto.priority, dto.tiers, dto.target),
    );

    return { id };
  }
}
