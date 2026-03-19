import { OwnerContract } from '../entities/owner-contract.entity';

export abstract class OwnerContractRepositoryPort {
  abstract load(id: string): Promise<OwnerContract | null>;
  abstract save(contract: OwnerContract): Promise<string>;
}
