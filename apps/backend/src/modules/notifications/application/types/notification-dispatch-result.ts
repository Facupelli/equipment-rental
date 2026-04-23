import { NotificationChannel } from '../../domain/notification-channel.enum';
import { EmailDeliveryFailure } from '../ports/email-delivery.port';

export interface NotificationChannelFailure {
  channel: NotificationChannel;
  reason: EmailDeliveryFailure['reason'] | 'UNSUPPORTED_CHANNEL';
  message: string;
}

export interface NotificationDispatchResult {
  attemptedChannels: NotificationChannel[];
  deliveredChannels: NotificationChannel[];
  skippedChannels: NotificationChannel[];
  failedChannels: NotificationChannelFailure[];
}
