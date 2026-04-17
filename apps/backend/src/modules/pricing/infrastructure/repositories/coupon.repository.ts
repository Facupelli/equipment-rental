import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponMapper } from '../persistence/mappers/coupon.mapper';

@Injectable()
export class CouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: i have a unit of work
  async load(id: string, tx?: PrismaTransactionClient): Promise<Coupon | null> {
    const client = tx ?? this.prisma.client;
    const raw = await client.coupon.findUnique({
      where: { id },
    });

    return raw ? CouponMapper.toDomain(raw) : null;
  }

  async loadByTenantAndCode(tenantId: string, code: string, tx?: PrismaTransactionClient): Promise<Coupon | null> {
    const client = tx ?? this.prisma.client;
    const raw = await client.coupon.findFirst({
      where: {
        tenantId,
        code: code.trim().toUpperCase(),
      },
    });

    return raw ? CouponMapper.toDomain(raw) : null;
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
