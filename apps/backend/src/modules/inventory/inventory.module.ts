import { Module } from '@nestjs/common';
import { AssetRepositoryPort } from './domain/ports/asset.repository.port';
import { AssetRepository } from './infrastructure/persistance/repositories/asset.repository';
import { TenantModule } from '../tenant/tenant.module';
import { AssetController } from './infrastructure/controllers/asset.controller';
import { CreateAssetCommandHandler } from './application/commands/create-asset/create-asset.command-handler';

const repositories = [
  {
    provide: AssetRepositoryPort,
    useClass: AssetRepository,
  },
];

const commandHandlers = [CreateAssetCommandHandler];

@Module({
  imports: [TenantModule],
  controllers: [AssetController],
  providers: [...repositories, ...commandHandlers],
})
export class InventoryModule {}
