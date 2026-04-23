import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { TenantConfig } from '@repo/schemas';
import { GetTenantConfigQuery } from 'src/modules/tenant/public/queries/get-tenant-config.query';

import { getAllowedChannelsForNotificationType } from '../domain/notification-channel-registry';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationType } from '../domain/notification-type.enum';

@Injectable()
export class NotificationChannelPolicyResolver {
  constructor(private readonly queryBus: QueryBus) {}

  async resolveChannels(tenantId: string, notificationType: NotificationType): Promise<readonly NotificationChannel[]> {
    const allowedChannels = getAllowedChannelsForNotificationType(notificationType);
    const tenantConfig = await this.queryBus.execute<GetTenantConfigQuery, TenantConfig | null>(
      new GetTenantConfigQuery(tenantId),
    );

    if (!tenantConfig) {
      return [];
    }

    const enabledChannels = new Set(this.mapTenantChannelsToNotificationChannels(tenantConfig));

    return allowedChannels.filter((channel) => enabledChannels.has(channel));
  }

  private mapTenantChannelsToNotificationChannels(tenantConfig: TenantConfig): NotificationChannel[] {
    return tenantConfig.notifications.enabledChannels.flatMap((channel) => {
      switch (channel) {
        case 'EMAIL':
          return [NotificationChannel.EMAIL];
        default:
          return [];
      }
    });
  }
}
