import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import Decimal from 'decimal.js';
import { CreateOwnerContractCommand } from './create-owner-contract.command';
import { err, ok, Result } from 'src/core/result';
import { OwnerContract } from '../../../domain/entities/owner-contract.entity';
import { ShareSplit } from '../../../domain/value-objects/share-split.value-object';
import {
  AssetNotFoundError,
  AssetNotOwnedByOwnerError,
  OverlappingContractError,
  OwnerNotFoundError,
} from '../../../domain/errors/owner-contract.errors';
import { InventoryPublicApi } from 'src/modules/inventory/inventory.public-api';
import { OwnerRepository } from '../../../infrastructure/persistence/repositories/owner.repository';
import { OwnerContractRepository } from '../../../infrastructure/persistence/repositories/owner-contract.repository';

type CreateOwnerContractError =
  | OwnerNotFoundError
  | AssetNotFoundError
  | AssetNotOwnedByOwnerError
  | OverlappingContractError;

@CommandHandler(CreateOwnerContractCommand)
export class CreateOwnerContractCommandHandler implements ICommandHandler<CreateOwnerContractCommand> {
  constructor(
    private readonly ownerRepo: OwnerRepository,
    private readonly contractRepo: OwnerContractRepository,
    private readonly inventoryApi: InventoryPublicApi,
  ) {}

  async execute(command: CreateOwnerContractCommand): Promise<Result<string, CreateOwnerContractError>> {
    const owner = await this.ownerRepo.load(command.ownerId, command.tenantId);
    if (!owner || owner.tenantId !== command.tenantId) {
      return err(new OwnerNotFoundError(command.ownerId));
    }

    if (command.assetId !== null) {
      const asset = await this.inventoryApi.findAssetById(command.tenantId, command.assetId);

      if (!asset) {
        return err(new AssetNotFoundError(command.assetId));
      }

      if (asset.ownerId !== command.ownerId) {
        return err(new AssetNotOwnedByOwnerError(command.ownerId, command.assetId));
      }
    }

    const hasOverlap = await this.contractRepo.hasOverlappingContract(
      command.tenantId,
      command.ownerId,
      command.assetId,
      command.validFrom,
      command.validUntil,
    );

    if (hasOverlap) {
      return err(new OverlappingContractError(command.ownerId, command.assetId));
    }

    const contract = OwnerContract.create({
      tenantId: command.tenantId,
      ownerId: command.ownerId,
      assetId: command.assetId,
      shares: new ShareSplit(new Decimal(command.ownerShare), new Decimal(command.rentalShare)),
      basis: command.basis,
      validFrom: command.validFrom,
      validUntil: command.validUntil,
      notes: command.notes,
    });

    await this.contractRepo.save(contract);

    return ok(contract.id);
  }
}
