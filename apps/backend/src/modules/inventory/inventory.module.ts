import { Module } from '@nestjs/common';
import { AssetRepository } from './infrastructure/persistance/repositories/asset.repository';
import { CreateAssetCommandHandler } from './application/commands/create-asset/create-asset.command-handler';
import { CreateAssetHttpController } from './application/commands/create-asset/create-asset.http.controller';
import { GetAssetByIdQueryHandler } from './application/queries/get-asset-by-id/get-asset-by-id.query-handler';
import { GetAssetsQueryHandler } from './application/queries/get-assets/get-assets.query-handler';
import { FindAssetByIdQueryHandler } from './application/queries/find-asset-by-id/find-asset-by-id.query-handler';
import { AssetAssignmentRepository } from './infrastructure/persistance/repositories/asset-assignment.repository';
import { InventoryPublicApi } from './inventory.public-api';
import { InventoryApplicationService } from './application/inventory.application-service';
import { AssetAvailabilityService } from './infrastructure/services/asset-availability.service';
import { CatalogModule } from '../catalog/catalog.module';
import { AssetSerialNumberService } from './infrastructure/services/asset-serial-number.service';
import { GetAssetsHttpController } from './application/queries/get-assets/get-assets.http.controller';
import { GetAssetByIdHttpController } from './application/queries/get-asset-by-id/get-asset-by-id.http.controller';

const repositories = [AssetRepository, AssetAssignmentRepository];

const commandHandlers = [CreateAssetCommandHandler];

const queryHandlers = [FindAssetByIdQueryHandler, GetAssetByIdQueryHandler, GetAssetsQueryHandler];

@Module({
  imports: [CatalogModule],
  controllers: [CreateAssetHttpController, GetAssetsHttpController, GetAssetByIdHttpController],
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
