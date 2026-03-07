import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddProductPricingTierCommand } from './add-product-pricing-tier.command';
import { PricingTier } from 'src/modules/catalog/domain/entities/pricing-tier.entity';
import { ProductTypeRepositoryPort } from 'src/modules/catalog/domain/ports/product-type.repository.port';

@CommandHandler(AddProductPricingTierCommand)
export class AddBundlePricingTierHandler implements ICommandHandler<AddProductPricingTierCommand> {
  constructor(private readonly productRepo: ProductTypeRepositoryPort) {}

  async execute(command: AddProductPricingTierCommand): Promise<string> {
    const product = await this.productRepo.load(command.productTypeId);
    if (!product) {
      throw new NotFoundException(command.productTypeId);
    }

    const tier = PricingTier.create({
      productTypeId: command.productTypeId,
      locationId: command.locationId,
      fromUnit: command.fromUnit,
      toUnit: command.toUnit,
      pricePerUnit: command.pricePerUnit,
    });

    product.addPricingTier(tier);
    await this.productRepo.save(product);

    return tier.id;
  }
}
