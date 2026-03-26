import { Module } from '@nestjs/common';
import { AssetRepository } from './infrastructure/persistance/repositories/asset.repository';
import { AssetController } from './infrastructure/controllers/asset.controller';
import { CreateAssetCommandHandler } from './application/commands/create-asset/create-asset.command-handler';
import { GetAssetByIdQueryHandler } from './presentation/queries/get-asset-by-id/get-asset-by-id.query-handler';
import { GetAssetsQueryHandler } from './presentation/queries/get-assets/get-assets.query-handler';
import { AssetAssignmentRepository } from './infrastructure/persistance/repositories/asset-assignment.repository';
import { InventoryPublicApi } from './inventory.public-api';
import { InventoryApplicationService } from './application/inventory.application-service';
import { AssetAvailabilityService } from './infrastructure/services/asset-availability.service';
import { CatalogModule } from '../catalog/catalog.module';
import { AssetSerialNumberService } from './infrastructure/services/asset-serial-number.service';

const repositories = [AssetRepository, AssetAssignmentRepository];

const commandHandlers = [CreateAssetCommandHandler];

const queryHandlers = [GetAssetByIdQueryHandler, GetAssetsQueryHandler];

@Module({
  imports: [CatalogModule],
  controllers: [AssetController],
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    AssetAvailabilityService,
    AssetSerialNumberService,
    { provide: InventoryPublicApi, useClass: InventoryApplicationService },
  ],
  exports: [InventoryPublicApi],
})
export class InventoryModule {}
