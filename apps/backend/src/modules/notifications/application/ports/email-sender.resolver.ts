import { EmailSender } from './email-delivery.port';

export abstract class EmailSenderResolver {
  abstract resolve(tenantId: string): Promise<EmailSender>;
}
