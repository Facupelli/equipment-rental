import { CustomDomainStatus } from '@repo/types';

export interface CustomDomainReadModel {
  domain: string;
  status: CustomDomainStatus;
  verifiedAt: Date | null;
  lastError: string | null;
}
