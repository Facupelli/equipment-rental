import { Order } from '../entities/order.entity';

export type PrismaTransactionClient = any;

export abstract class OrderRepositoryPort {
  abstract load(id: string): Promise<Order | null>;
  abstract save(order: Order, tx: PrismaTransactionClient): Promise<string>;
}
