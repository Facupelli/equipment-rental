import { Injectable } from '@nestjs/common';
import { BundleDto, CatalogPublicApi, ProductTypeDto } from '../catalog.public-api';
import { PrismaService } from 'src/core/database/prisma.service';
import { TrackingMode } from '@repo/types';

@Injectable()
export class CatalogApplicationService implements CatalogPublicApi {
  constructor(private readonly prisma: PrismaService) {}

  async getProductType(id: string): Promise<ProductTypeDto | null> {
    const row = await this.prisma.client.productType.findUnique({
      where: { id },
      select: { id: true, trackingMode: true, retiredAt: true, publishedAt: true },
    });

    if (!row) {
      return null;
    }

    return new ProductTypeDto(row.id, row.trackingMode as TrackingMode, row.retiredAt, row.publishedAt);
  }

  async getBundle(id: string): Promise<BundleDto | null> {
    const row = await this.prisma.client.bundle.findUnique({
      where: { id },
      select: { id: true, retiredAt: true, publishedAt: true },
    });

    if (!row) {
      return null;
    }

    return new BundleDto(row.id, row.retiredAt, row.publishedAt);
  }
}
