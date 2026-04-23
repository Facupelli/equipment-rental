import { NotificationType } from '../../domain/notification-type.enum';
import { FulfillmentMethod, OrderStatus } from '@repo/types';

export interface PasswordResetEmailPayload {
  resetUrl: string;
  recipientName?: string;
  tenantName?: string;
  expiresAt?: Date;
}

export interface OrderCancelledEmailPayload {
  tenantName?: string;
  recipientName?: string;
}

export interface OrderCreatedByCustomerEmailPayload {
  tenantName?: string;
  orderNumber: number;
  customerEmail: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  locationName?: string;
  timezone?: string;
}

export interface OrderCreatedConfirmationEmailPayload {
  tenantName?: string;
  orderNumber: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export interface NotificationEmailPayloadMap {
  [NotificationType.ORDER_CREATED_CONFIRMATION]: OrderCreatedConfirmationEmailPayload;
  [NotificationType.ORDER_CREATED_BY_CUSTOMER]: OrderCreatedByCustomerEmailPayload;
  [NotificationType.ORDER_CANCELLED]: OrderCancelledEmailPayload;
  [NotificationType.PASSWORD_RESET]: PasswordResetEmailPayload;
}

export type RenderEmailInput<T extends NotificationType = NotificationType> = {
  notificationType: T;
  tenantId: string;
  payload: NotificationEmailPayloadMap[T];
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export abstract class EmailRenderer {
  abstract render<T extends NotificationType>(input: RenderEmailInput<T>): Promise<RenderedEmail>;
}
