import { NotificationChannel } from './notification-channel.enum';
import { NotificationType } from './notification-type.enum';

const notificationChannelRegistry: Record<NotificationType, readonly NotificationChannel[]> = {
  [NotificationType.PASSWORD_RESET]: [NotificationChannel.EMAIL],
};

export function getAllowedChannelsForNotificationType(
  notificationType: NotificationType,
): readonly NotificationChannel[] {
  return notificationChannelRegistry[notificationType];
}
