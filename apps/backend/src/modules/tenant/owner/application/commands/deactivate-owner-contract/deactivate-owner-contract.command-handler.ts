import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeactivateOwnerContractCommand } from './deactivate-owner-contract.command';
import { OwnerContractRepositoryPort } from '../../../domain/ports/owner-contract.repository.port';
import { ok, err, Result } from 'src/core/result';
import { ContractNotFoundError } from '../../errors/owner-contract.errors';

type DeactivateOwnerContractError = ContractNotFoundError;

@CommandHandler(DeactivateOwnerContractCommand)
export class DeactivateOwnerContractHandler implements ICommandHandler<DeactivateOwnerContractCommand> {
  constructor(private readonly contractRepo: OwnerContractRepositoryPort) {}

  async execute(command: DeactivateOwnerContractCommand): Promise<Result<void, DeactivateOwnerContractError>> {
    const contract = await this.contractRepo.load(command.contractId);

    if (!contract || contract.tenantId !== command.tenantId) {
      return err(new ContractNotFoundError());
    }

    contract.deactivate();

    await this.contractRepo.save(contract);

    return ok(undefined);
  }
}
