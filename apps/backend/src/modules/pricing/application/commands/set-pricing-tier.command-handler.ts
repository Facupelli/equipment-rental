import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PricingConfiguration } from '../../domain/entities/pricing-configuration.entity';
import { PricingTier } from '../../domain/entities/pricing-tier.entity';
import {
  PricingTargetInactiveError,
  PricingTargetNotFoundException,
} from '../../domain/exceptions/pricing-tier.exceptions';
import { SetPricingTiersCommand } from './set-pricing-tier.command';
import { CatalogPublicApi } from 'src/modules/catalog/catalog.public-api';
import { err, Result, ok } from 'src/core/result';
import { PricingConfigurationRepositoryPort } from '../../domain/ports/pricing-config.repository.port';

type SetPricingTiersError = PricingTargetNotFoundException | PricingTargetInactiveError;

@CommandHandler(SetPricingTiersCommand)
export class SetPricingTiersCommandHandler implements ICommandHandler<SetPricingTiersCommand> {
  constructor(
    private readonly pricingConfigRepo: PricingConfigurationRepositoryPort,
    private readonly catalogApi: CatalogPublicApi,
  ) {}

  async execute(command: SetPricingTiersCommand): Promise<Result<void, SetPricingTiersError>> {
    const target =
      command.targetType === 'PRODUCT_TYPE'
        ? await this.catalogApi.getProductType(command.targetId)
        : await this.catalogApi.getBundle(command.targetId);

    if (!target) {
      return err(new PricingTargetNotFoundException(command.targetType, command.targetId));
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
      command.tiers.map((t) => {
        const tier = PricingTier.create({
          productTypeId,
          locationId: t.locationId,
          fromUnit: t.fromUnit,
          toUnit: t.toUnit,
          pricePerUnit: t.pricePerUnit,
        });
        incomingTiers.push(tier);
      });
    } else if (command.targetType === 'BUNDLE' && bundleId) {
      command.tiers.map((t) => {
        const tier = PricingTier.create({
          bundleId,
          locationId: t.locationId,
          fromUnit: t.fromUnit,
          toUnit: t.toUnit,
          pricePerUnit: t.pricePerUnit,
        });
        incomingTiers.push(tier);
      });
    }

    configuration.setTiers(incomingTiers);

    await this.pricingConfigRepo.save(configuration);

    return ok(undefined);
  }
}
