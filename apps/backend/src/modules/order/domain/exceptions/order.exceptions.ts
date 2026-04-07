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

export class OrderNotFoundException extends Error {
  constructor(orderId: string) {
    super(`Order '${orderId}' not found.`);
    this.name = 'OrderNotFoundException';
  }
}

export class OrderAssignmentsNotFoundException extends Error {
  constructor(orderId: string) {
    super(`Order '${orderId}' has no assignments.`);
    this.name = 'OrderAssignmentsNotFoundException';
  }
}

export class MissingOrderDeliveryRequestException extends Error {
  constructor() {
    super('Delivery orders must include a delivery request snapshot.');
    this.name = 'MissingOrderDeliveryRequestException';
  }
}

export class TenantConfigNotFoundException extends Error {
  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' config was not found.`);
    this.name = 'TenantConfigNotFoundException';
  }
}

export class BundleComponentNotFoundException extends Error {
  constructor(componentId: string) {
    super(`Bundle component '${componentId}' not found.`);
    this.name = 'BundleComponentNotFoundException';
  }
}

export class OwnerSplitAlreadyVoidedException extends Error {
  constructor() {
    super('Owner split has already been voided.');
    this.name = 'OwnerSplitAlreadyVoidedException';
  }
}

export class OwnerSplitAlreadyAssignedException extends Error {
  constructor() {
    super('Owner split has already been assigned.');
    this.name = 'OwnerSplitAlreadyAssignedException';
  }
}
