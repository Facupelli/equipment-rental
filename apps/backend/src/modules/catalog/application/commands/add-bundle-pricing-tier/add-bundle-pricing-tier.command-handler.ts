import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddBundlePricingTierCommand } from './add-bundle-pricing-tier.command';
import { PricingTier } from 'src/modules/catalog/domain/entities/pricing-tier.entity';
import { BundleRepositoryPort } from 'src/modules/catalog/domain/ports/bundle-repository.port';

@CommandHandler(AddBundlePricingTierCommand)
export class AddBundlePricingTierHandler implements ICommandHandler<AddBundlePricingTierCommand> {
  constructor(private readonly bundleRepo: BundleRepositoryPort) {}

  async execute(command: AddBundlePricingTierCommand): Promise<string> {
    const bundle = await this.bundleRepo.load(command.bundleId);
    if (!bundle) {
      throw new NotFoundException(command.bundleId);
    }

    const tier = PricingTier.create({
      bundleId: command.bundleId,
      locationId: command.locationId,
      fromUnit: command.fromUnit,
      toUnit: command.toUnit,
      pricePerUnit: command.pricePerUnit,
    });

    bundle.addPricingTier(tier);
    await this.bundleRepo.save(bundle);

    return tier.id;
  }
}
