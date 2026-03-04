import { Module } from '@nestjs/common';
import { AssetRepositoryPort } from './domain/ports/asset.repository.port';
import { AssetRepository } from './infrastructure/persistance/repositories/asset.repository';
import { TenantModule } from '../tenant/tenant.module';
import { AssetController } from './infrastructure/controllers/asset.controller';
import { AssetService } from './application/asset.service';

const repositories = [
  {
    provide: AssetRepositoryPort,
    useClass: AssetRepository,
  },
];

const providers = [AssetService];

@Module({
  imports: [TenantModule],
  controllers: [AssetController],
  providers: [...repositories, ...providers],
})
export class InventoryModule {}
