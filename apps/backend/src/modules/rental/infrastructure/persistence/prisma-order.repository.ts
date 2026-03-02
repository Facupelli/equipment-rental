import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { OrderRepositoryPort } from '../../application/ports/order.repository.port';

@Injectable()
export class PrismaOrderRepository extends OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
}
