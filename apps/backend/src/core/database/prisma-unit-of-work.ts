import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service';

export type PrismaTransactionClient = Parameters<PrismaService['client']['$transaction']>[0] extends (
  tx: infer T,
  ...args: never[]
) => Promise<unknown>
  ? T
  : never;

@Injectable()
export class PrismaUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(work: (tx: PrismaTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.client.$transaction(async (tx) => {
      return work(tx);
    });
  }
}
