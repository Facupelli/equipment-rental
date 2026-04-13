import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { PrismaTransactionClient } from 'src/core/database/prisma-unit-of-work';
import { LongRentalDiscount } from '../../domain/entities/long-rental-discount.entity';
import { LongRentalDiscountMapper } from '../persistence/mappers/long-rental-discount.mapper';

@Injectable()
export class LongRentalDiscountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(id: string): Promise<LongRentalDiscount | null> {
    const raw = await this.prisma.client.longRentalDiscount.findUnique({
      where: { id },
      include: { exclusions: true },
    });

    return raw ? LongRentalDiscountMapper.toDomain(raw) : null;
  }

  async save(discount: LongRentalDiscount, tx?: PrismaTransactionClient): Promise<string> {
    const client = tx ?? this.prisma.client;
    const row = LongRentalDiscountMapper.toPersistence(discount);

    await client.longRentalDiscount.upsert({
      where: { id: discount.id },
      create: row,
      update: row,
    });

    await client.longRentalDiscountExclusion.deleteMany({
      where: { longRentalDiscountId: discount.id },
    });

    const exclusions = LongRentalDiscountMapper.toExclusionRows(discount);
    if (exclusions.length > 0) {
      await client.longRentalDiscountExclusion.createMany({
        data: exclusions,
      });
    }

    return discount.id;
  }

  async delete(id: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx ?? this.prisma.client;

    await client.longRentalDiscountExclusion.deleteMany({
      where: { longRentalDiscountId: id },
    });

    await client.longRentalDiscount.delete({
      where: { id },
    });
  }
}
