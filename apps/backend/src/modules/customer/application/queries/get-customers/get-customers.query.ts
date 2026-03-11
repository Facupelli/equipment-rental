import { OnboardingStatus } from '@repo/types';

export class GetCustomersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly onboardingStatus: OnboardingStatus | null,
    public readonly isActive: boolean | null,
    public readonly isCompany: boolean | null,
    public readonly search: string | null,
  ) {}
}
