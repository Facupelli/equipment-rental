/**
 * Projects only the tenant configuration fields relevant to the RentalModule.
 * The full configuration is owned by the TenantModule; this interface defines
 * the contract that the RentalModule depends on — nothing more.
 */
export interface TenantConfig {
  overRentalEnabled: boolean;
  maxOverRentThreshold: number;
}

export abstract class TenantConfigPort {
  abstract getConfig(tenantId: string): Promise<TenantConfig>;
}
