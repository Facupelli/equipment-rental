import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { SetPricingTiersCommand } from '../../application/commands/set-pricing-tier.command';
import { SetPricingTiersDto } from '@repo/schemas';

@Controller('pricing-tiers')
export class PricingTierController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async setPricingTiers(@Body() dto: SetPricingTiersDto): Promise<string> {
    const command = new SetPricingTiersCommand(dto.targetType, dto.targetId, dto.tiers);

    return await this.commandBus.execute(command);
  }
}
