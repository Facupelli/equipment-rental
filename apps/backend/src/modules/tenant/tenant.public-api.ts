export { TenantRegisteredEvent } from './public/events/tenant-registered.event';

export type FindActiveOwnerContractDto = {
  tenantId: string;
  ownerId: string;
  assetId: string;
  date: Date;
};

export type ActiveOwnerContractDto = {
  contractId: string;
  ownerId: string;
  ownerShare: string;
  rentalShare: string;
  basis: string;
};

export abstract class TenantPublicApi {
  abstract findActiveOwnerContract(dto: FindActiveOwnerContractDto): Promise<ActiveOwnerContractDto | null>;
}
