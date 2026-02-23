import { Module } from '@nestjs/common';
import { InventoryController } from './infrastructure/controllers/inventory.controller';

@Module({
  controllers: [InventoryController],
})
export class InventoryModule {}
