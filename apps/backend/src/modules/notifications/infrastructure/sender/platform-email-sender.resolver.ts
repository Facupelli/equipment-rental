import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from 'src/config/env.schema';

import { EmailSender } from '../../application/ports/email-delivery.port';
import { EmailSenderResolver } from '../../application/ports/email-sender.resolver';

@Injectable()
export class PlatformEmailSenderResolver implements EmailSenderResolver {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  async resolve(_tenantId: string): Promise<EmailSender> {
    return {
      fromEmail: this.configService.get('NOTIFICATIONS_EMAIL_FROM'),
      fromName: this.configService.get('NOTIFICATIONS_EMAIL_FROM_NAME'),
      replyTo: this.configService.get('NOTIFICATIONS_EMAIL_REPLY_TO'),
    };
  }
}
