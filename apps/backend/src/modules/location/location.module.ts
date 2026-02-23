import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PrismaLocationRepository } from './prisma-location.repository';
import { LocationRepositoryPort } from './ports/location.repository';

@Module({
  imports: [TenancyModule],
  controllers: [LocationController],
  providers: [{ provide: LocationRepositoryPort, useClass: PrismaLocationRepository }, LocationService],
})
export class LocationModule {}
