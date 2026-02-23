import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma } from 'src/generated/prisma/browser';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: Prisma.CustomerUncheckedCreateInput): Promise<string> {
    const result = await this.prisma.client.role.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    return result.id;
  }
}
