import { Module } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PrismaOwnerRepository } from './infrastructure/prisma-owner.repository';
import { OwnerController } from './infrastructure/owner.controller';
import { OwnerRepositoryPort } from './application/ports/owner-repository.port';

@Module({
  imports: [TenancyModule],
  controllers: [OwnerController],
  providers: [{ provide: OwnerRepositoryPort, useClass: PrismaOwnerRepository }, OwnerService],
})
export class OwnerModule {}
