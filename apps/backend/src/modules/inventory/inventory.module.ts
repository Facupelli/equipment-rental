import { Module } from '@nestjs/common';
import { AssetRepository } from './infrastructure/persistence/repositories/asset.repository';
import { CreateAssetService } from './application/commands/create-asset/create-asset.service';
import { CreateAssetHttpController } from './application/commands/create-asset/create-asset.http.controller';
import { UpdateAssetService } from './application/commands/update-asset/update-asset.service';
import { UpdateAssetHttpController } from './application/commands/update-asset/update-asset.http.controller';
import { DeactivateAssetService } from './application/commands/deactivate-asset/deactivate-asset.service';
import { DeactivateAssetHttpController } from './application/commands/deactivate-asset/deactivate-asset.http.controller';
import { SoftDeleteAssetService } from './application/commands/soft-delete-asset/soft-delete-asset.service';
import { SoftDeleteAssetHttpController } from './application/commands/soft-delete-asset/soft-delete-asset.http.controller';
import { GetAssetByIdQueryHandler } from './application/queries/get-asset-by-id/get-asset-by-id.query-handler';
import { GetAssetsQueryHandler } from './application/queries/get-assets/get-assets.query-handler';
import { FindAssetByIdQueryHandler } from './application/queries/find-asset-by-id/find-asset-by-id.query-handler';
import { AssetAssignmentRepository } from './infrastructure/persistence/repositories/asset-assignment.repository';
import { InventoryFacade } from './inventory.facade';
import { InventoryPublicApi } from './inventory.public-api';
import { AssetAvailabilityService } from './infrastructure/read-services/asset-availability.service';
import { CatalogModule } from '../catalog/catalog.module';
import { AssetSerialNumberService } from './infrastructure/read-services/asset-serial-number.service';
import { GetAssetsHttpController } from './application/queries/get-assets/get-assets.http.controller';
import { GetAssetByIdHttpController } from './application/queries/get-asset-by-id/get-asset-by-id.http.controller';
import { GetAvailableAssetCountsQueryHandler } from './application/queries/get-available-asset-counts/get-available-asset-counts.query-handler';

const repositories = [AssetRepository, AssetAssignmentRepository];

const commandHandlers = [CreateAssetService, UpdateAssetService, DeactivateAssetService, SoftDeleteAssetService];

const queryHandlers = [
  FindAssetByIdQueryHandler,
  GetAssetByIdQueryHandler,
  GetAssetsQueryHandler,
  GetAvailableAssetCountsQueryHandler,
];

@Module({
  imports: [CatalogModule],
  controllers: [
    CreateAssetHttpController,
    UpdateAssetHttpController,
    DeactivateAssetHttpController,
    SoftDeleteAssetHttpController,
    GetAssetsHttpController,
    GetAssetByIdHttpController,
  ],
  providers: [
    ...repositories,
    ...commandHandlers,
    ...queryHandlers,
    AssetAvailabilityService,
    AssetSerialNumberService,
    { provide: InventoryPublicApi, useClass: InventoryFacade },
  ],
  exports: [InventoryPublicApi],
})
export class InventoryModule {}
