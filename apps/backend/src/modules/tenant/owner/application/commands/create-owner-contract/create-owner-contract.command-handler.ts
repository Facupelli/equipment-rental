import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import Decimal from 'decimal.js';
import { CreateOwnerContractCommand } from './create-owner-contract.command';
import { OwnerRepositoryPort } from 'src/modules/tenant/owner/domain/ports/owner.repository.port';
import { OwnerContractRepositoryPort } from '../../../domain/ports/owner-contract.repository.port';
import { err, ok, Result } from 'src/core/result';
import { OwnerContract } from '../../../domain/entities/owner-contract.entity';
import { ShareSplit } from '../../../domain/value-objects/share-split.vo';
import {
  AssetNotFoundError,
  AssetNotOwnedByOwnerError,
  OverlappingContractError,
  OwnerNotFoundError,
} from '../../errors/owner-contract.errors';
import {
  AssetDto,
  FindAssetByIdQuery,
} from 'src/modules/inventory/application/queries/find-asset-by-id/find-asset-by-id.query';

type CreateOwnerContractError =
  | OwnerNotFoundError
  | AssetNotFoundError
  | AssetNotOwnedByOwnerError
  | OverlappingContractError;

@CommandHandler(CreateOwnerContractCommand)
export class CreateOwnerContractCommandHandler implements ICommandHandler<CreateOwnerContractCommand> {
  constructor(
    private readonly ownerRepo: OwnerRepositoryPort,
    private readonly contractRepo: OwnerContractRepositoryPort,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateOwnerContractCommand): Promise<Result<string, CreateOwnerContractError>> {
    const owner = await this.ownerRepo.load(command.ownerId);
    if (!owner || owner.tenantId !== command.tenantId) {
      return err(new OwnerNotFoundError());
    }

    if (command.assetId !== null) {
      const asset = await this.queryBus.execute<FindAssetByIdQuery, AssetDto | null>(
        new FindAssetByIdQuery(command.tenantId, command.assetId),
      );

      if (!asset) {
        return err(new AssetNotFoundError());
      }

      if (asset.ownerId !== command.ownerId) {
        return err(new AssetNotOwnedByOwnerError());
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
      return err(new OverlappingContractError());
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
