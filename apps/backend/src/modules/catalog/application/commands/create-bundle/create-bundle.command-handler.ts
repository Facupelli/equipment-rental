import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBundleCommand } from './create-bundle.command';
import { BundleRepositoryPort } from 'src/modules/catalog/domain/ports/bundle-repository.port';
import { NotFoundException } from '@nestjs/common';
import { Bundle } from 'src/modules/catalog/domain/entities/bundle.entity';
import { CatalogApplicationService } from '../../catalog.application-service';
import { TenantContextService } from 'src/modules/tenant/application/tenant-context.service';

@CommandHandler(CreateBundleCommand)
export class CreateBundleCommandHandler implements ICommandHandler<CreateBundleCommand> {
  constructor(
    private readonly bundleRepo: BundleRepositoryPort,
    private readonly catalogService: CatalogApplicationService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(command: CreateBundleCommand): Promise<string> {
    const productTypes = await Promise.all(
      command.components.map((component) => this.catalogService.getProductType(component.productTypeId)),
    );

    const missingIndex = productTypes.findIndex((productType) => productType === null);
    if (missingIndex !== -1) {
      throw new NotFoundException(command.components[missingIndex].productTypeId);
    }

    const tenantId = await this.tenantContext.requireTenantId();

    const bundle = Bundle.create({
      tenantId,
      billingUnitId: command.billingUnitId,
      name: command.name,
      isActive: command.isActive,
    });

    for (const component of command.components) {
      bundle.addComponent(component.productTypeId, component.quantity);
    }

    await this.bundleRepo.save(bundle);
    return bundle.id;
  }
}
