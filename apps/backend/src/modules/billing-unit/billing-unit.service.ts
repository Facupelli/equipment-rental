import { Injectable } from '@nestjs/common';
import { BillingUnitListResponse } from '@repo/schemas';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class BillingUnitService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<BillingUnitListResponse> {
    const rows = await this.prisma.client.billingUnit.findMany();
    return rows;
  }
}
