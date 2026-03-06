import { Injectable } from '@nestjs/common';
import { CatalogPublicApi, ProductTypeDto } from '../catalog.public-api';
import { PrismaService } from 'src/core/database/prisma.service';
import { TrackingMode } from '@repo/types';

@Injectable()
export class CatalogApplicationService implements CatalogPublicApi {
  constructor(private readonly prisma: PrismaService) {}

  async getProductType(id: string): Promise<ProductTypeDto | null> {
    const row = await this.prisma.client.productType.findUnique({
      where: { id },
      select: { id: true, trackingMode: true },
    });

    if (!row) {
      return null;
    }

    return new ProductTypeDto(row.id, row.trackingMode as TrackingMode);
  }
}
