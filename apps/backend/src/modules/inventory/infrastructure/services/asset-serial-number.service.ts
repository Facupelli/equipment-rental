import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class AssetSerialNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async isTaken(serialNumber: string): Promise<boolean> {
    const count = await this.prisma.client.asset.count({
      where: { serialNumber },
    });

    return count > 0;
  }
}
