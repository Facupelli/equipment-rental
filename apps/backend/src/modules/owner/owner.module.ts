import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { TenancyModule } from '../tenancy/tenancy.module';
import { OwnerRepositoryPort } from './ports/owner-repository.port';
import { PrismaOwnerRepository } from './prisma-owner.repository';

@Module({
  imports: [TenancyModule],
  controllers: [OwnerController],
  providers: [{ provide: OwnerRepositoryPort, useClass: PrismaOwnerRepository }, OwnerService],
})
export class OwnerModule {}
