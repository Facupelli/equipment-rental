import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AssignmentType } from '@repo/types';

import { SaveInternalAssetAssignmentsService } from '../shared/save-internal-asset-assignments.service';
import { CreateBlackoutAssignmentsCommand } from './create-blackout-assignments.command';

@CommandHandler(CreateBlackoutAssignmentsCommand)
export class CreateBlackoutAssignmentsService implements ICommandHandler<CreateBlackoutAssignmentsCommand> {
  constructor(private readonly saveInternalAssetAssignments: SaveInternalAssetAssignmentsService) {}

  async execute(command: CreateBlackoutAssignmentsCommand) {
    return this.saveInternalAssetAssignments.execute({
      tenantId: command.tenantId,
      assetIds: command.assetIds,
      period: command.period,
      type: AssignmentType.BLACKOUT,
      reason: command.reason,
    });
  }
}
