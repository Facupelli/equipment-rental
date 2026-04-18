import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AssignmentType } from '@repo/types';

import { SaveInternalAssetAssignmentsService } from '../shared/save-internal-asset-assignments.service';
import { CreateMaintenanceAssignmentsCommand } from './create-maintenance-assignments.command';

@CommandHandler(CreateMaintenanceAssignmentsCommand)
export class CreateMaintenanceAssignmentsService implements ICommandHandler<CreateMaintenanceAssignmentsCommand> {
  constructor(private readonly saveInternalAssetAssignments: SaveInternalAssetAssignmentsService) {}

  async execute(command: CreateMaintenanceAssignmentsCommand) {
    return this.saveInternalAssetAssignments.execute({
      tenantId: command.tenantId,
      assetIds: command.assetIds,
      period: command.period,
      type: AssignmentType.MAINTENANCE,
      reason: command.reason,
    });
  }
}
