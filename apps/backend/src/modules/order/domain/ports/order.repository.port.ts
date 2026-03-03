import { Order } from '../entities/order.entity';

export abstract class OrderRepositoryPort {
  abstract load(id: string): Promise<Order | null>;
  abstract save(order: Order): Promise<string>;
}
