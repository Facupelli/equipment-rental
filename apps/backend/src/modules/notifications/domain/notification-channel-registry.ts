import { NotificationChannel } from './notification-channel.enum';
import { NotificationType } from './notification-type.enum';

const notificationChannelRegistry: Record<NotificationType, readonly NotificationChannel[]> = {
  [NotificationType.ORDER_CREATED_CONFIRMATION]: [NotificationChannel.EMAIL],
  [NotificationType.ORDER_CREATED_BY_CUSTOMER]: [NotificationChannel.EMAIL],
  [NotificationType.ORDER_CANCELLED]: [NotificationChannel.EMAIL],
  [NotificationType.DOCUMENT_SIGNING_INVITATION]: [NotificationChannel.EMAIL],
  [NotificationType.PASSWORD_RESET]: [NotificationChannel.EMAIL],
};

export function getAllowedChannelsForNotificationType(
  notificationType: NotificationType,
): readonly NotificationChannel[] {
  return notificationChannelRegistry[notificationType];
}
