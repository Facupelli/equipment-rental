import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class AssetSerialNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async isTaken(serialNumber: string, excludedAssetId?: string): Promise<boolean> {
    const count = await this.prisma.client.asset.count({
      where: {
        serialNumber,
        ...(excludedAssetId ? { id: { not: excludedAssetId } } : {}),
      },
    });

    return count > 0;
  }
}
