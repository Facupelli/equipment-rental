import { OrderStatus } from '@repo/types';

export class InvalidOrderStatusTransitionException extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order from '${from}' to '${to}'.`);
    this.name = 'InvalidOrderStatusTransitionException';
  }
}

export class OrderItemNotAllowedException extends Error {
  constructor(status: OrderStatus) {
    super(`Cannot add items to an order in '${status}' status.`);
    this.name = 'OrderItemNotAllowedException';
  }
}

export class OrderItemNotFoundException extends Error {
  constructor(itemId: string) {
    super(`Order item '${itemId}' not found.`);
    this.name = 'OrderItemNotFoundException';
  }
}

export type UnavailableItem = { type: 'PRODUCT'; productTypeId: string } | { type: 'BUNDLE'; bundleId: string };

export class OrderItemUnavailableError extends Error {
  constructor(public readonly unavailableItems: UnavailableItem[]) {
    super('One or more order items are not available for the requested period.');
    this.name = 'OrderItemUnavailableError';
  }
}
