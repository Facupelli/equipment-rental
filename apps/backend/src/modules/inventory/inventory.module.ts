import { Module } from '@nestjs/common';
import { AssetRepositoryPort } from './domain/ports/asset.repository.port';
import { AssetRepository } from './infrastructure/persistance/repositories/asset.repository';
import { TenantModule } from '../tenant/tenant.module';
import { AssetController } from './infrastructure/controllers/asset.controller';
import { CreateAssetCommandHandler } from './application/commands/create-asset/create-asset.command-handler';
import { GetAssetByIdQueryHandler } from './application/queries/get-asset-by-id/get-asset-by-id.query-handler';
import { GetAssetsQueryHandler } from './application/queries/get-assets/get-assets.query-handler';

const repositories = [
  {
    provide: AssetRepositoryPort,
    useClass: AssetRepository,
  },
];

const commandHandlers = [CreateAssetCommandHandler];

const queryHandlers = [GetAssetByIdQueryHandler, GetAssetsQueryHandler];

@Module({
  imports: [TenantModule],
  controllers: [AssetController],
  providers: [...repositories, ...commandHandlers, ...queryHandlers],
})
export class InventoryModule {}
