import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, Result, ok } from 'neverthrow';
import { CatalogPublicApi } from 'src/modules/catalog/catalog.public-api';
import { PricingConfiguration } from '../../../domain/entities/pricing-configuration.entity';
import { PricingTier } from '../../../domain/entities/pricing-tier.entity';
import { PricingTargetInactiveError, PricingTargetNotFoundError } from '../../../domain/errors/pricing.errors';
import { PricingConfigurationRepository } from '../../../infrastructure/repositories/pricing-config.repository';
import { SetPricingTiersCommand } from './set-pricing-tiers.command';

type SetPricingTiersError = PricingTargetNotFoundError | PricingTargetInactiveError;

@CommandHandler(SetPricingTiersCommand)
export class SetPricingTiersService implements ICommandHandler<SetPricingTiersCommand> {
  constructor(
    private readonly pricingConfigRepo: PricingConfigurationRepository,
    private readonly catalogApi: CatalogPublicApi,
  ) {}

  async execute(command: SetPricingTiersCommand): Promise<Result<void, SetPricingTiersError>> {
    const target =
      command.targetType === 'PRODUCT_TYPE'
        ? await this.catalogApi.getProductType(command.targetId)
        : await this.catalogApi.getBundle(command.targetId);

    if (!target) {
      return err(new PricingTargetNotFoundError(command.targetType, command.targetId));
    }

    if (target.retiredAt !== null) {
      return err(new PricingTargetInactiveError(command.targetType, command.targetId));
    }

    const configuration =
      (await this.pricingConfigRepo.load(command.targetType, command.targetId)) ??
      PricingConfiguration.create({ targetType: command.targetType, targetId: command.targetId });

    const productTypeId = command.targetType === 'PRODUCT_TYPE' ? command.targetId : undefined;
    const bundleId = command.targetType === 'BUNDLE' ? command.targetId : undefined;

    const incomingTiers: PricingTier[] = [];

    if (command.targetType === 'PRODUCT_TYPE' && productTypeId) {
      command.tiers.map((tierItem) => {
        const tier = PricingTier.create({
          productTypeId,
          locationId: tierItem.locationId,
          fromUnit: tierItem.fromUnit,
          toUnit: tierItem.toUnit,
          pricePerUnit: tierItem.pricePerUnit,
        });
        incomingTiers.push(tier);
      });
    } else if (command.targetType === 'BUNDLE' && bundleId) {
      command.tiers.map((tierItem) => {
        const tier = PricingTier.create({
          bundleId,
          locationId: tierItem.locationId,
          fromUnit: tierItem.fromUnit,
          toUnit: tierItem.toUnit,
          pricePerUnit: tierItem.pricePerUnit,
        });
        incomingTiers.push(tier);
      });
    }

    configuration.setTiers(incomingTiers);

    await this.pricingConfigRepo.save(configuration);

    return ok(undefined);
  }
}
