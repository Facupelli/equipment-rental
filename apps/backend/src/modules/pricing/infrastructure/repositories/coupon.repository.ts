import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Coupon } from '../../domain/entities/coupon.entity';
import { CouponRepositoryPort, PrismaTransactionClient } from '../../domain/ports/coupon.repository.port';
import { CouponMapper } from '../persistence/mappers/coupon.mapper';

@Injectable()
export class CouponRepository implements CouponRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<Coupon | null> {
    const raw = await this.prisma.client.coupon.findUnique({
      where: { id },
    });

    return raw ? CouponMapper.toDomain(raw) : null;
  }

  async loadByCode(tenantId: string, code: string): Promise<Coupon | null> {
    const raw = await this.prisma.client.coupon.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          // Normalize to uppercase — codes are stored uppercased at creation time.
          code: code.trim().toUpperCase(),
        },
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
