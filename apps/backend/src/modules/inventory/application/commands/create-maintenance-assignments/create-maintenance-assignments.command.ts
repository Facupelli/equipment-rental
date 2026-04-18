import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';

export class CreateMaintenanceAssignmentsCommand {
  constructor(
    public readonly tenantId: string,
    public readonly assetIds: string[],
    public readonly period: DateRange,
    public readonly reason: string | null,
  ) {}
}
