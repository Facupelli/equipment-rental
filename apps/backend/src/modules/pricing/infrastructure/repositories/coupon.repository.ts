import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponMapper } from '../persistence/mappers/coupon.mapper';

@Injectable()
export class CouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Coupon | null> {
    const raw = await this.prisma.client.coupon.findUnique({
      where: { id },
    });

    return raw ? CouponMapper.toDomain(raw) : null;
  }

  async loadByCode(tenantId: string, code: string): Promise<Coupon | null> {
    const row = await this.prisma.client.coupon.findFirst({
      where: {
        tenantId,
        code,
      },
    });

    if (!row) {
      return null;
    }
    return CouponMapper.toDomain(row);
  }

  async save(coupon: Coupon, tx?: PrismaTransactionClient): Promise<string> {
    const client = tx ?? this.prisma.client;
    const row = CouponMapper.toPersistence(coupon);

    await client.coupon.upsert({
      where: { id: row.id },
      create: row,
      update: row,
    });

    return coupon.id;
  }
}
