import { Order } from '../../domain/entities/order.entity';

export abstract class OrderRepositoryPort {
  // abstract findById(id: string, currency: string): Promise<Order | null>;
  abstract save(booking: Order): Promise<string>;
}
