import { Body, ConflictException, Controller, NotFoundException, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PricingTargetInactiveError, PricingTargetNotFoundError } from '../../../domain/errors/pricing.errors';
import { SetPricingTiersCommand } from './set-pricing-tiers.command';
import { SetPricingTiersRequestDto } from './set-pricing-tiers.request.dto';
import { SetPricingTiersResponseDto } from './set-pricing-tiers.response.dto';

@Controller('pricing-tiers')
export class SetPricingTiersHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async setPricingTiers(@Body() dto: SetPricingTiersRequestDto): Promise<SetPricingTiersResponseDto> {
    const command = new SetPricingTiersCommand(dto.targetType, dto.targetId, dto.tiers);
    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof PricingTargetNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof PricingTargetInactiveError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    const response: SetPricingTiersResponseDto = { success: true };
    return response;
  }
}
