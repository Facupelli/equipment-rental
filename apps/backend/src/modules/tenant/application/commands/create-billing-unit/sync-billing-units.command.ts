import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TenantContextService } from '../../tenant-context.service';
import { Result, ok } from 'src/core/result';
import { SyncTenantBillingUnitsCommand } from './sync-billing-units.command-handler';
import { PrismaService } from 'src/core/database/prisma.service';

@CommandHandler(SyncTenantBillingUnitsCommand)
export class SyncTenantBillingUnitsCommandHandler implements ICommandHandler<
  SyncTenantBillingUnitsCommand,
  Result<void, void>
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(command: SyncTenantBillingUnitsCommand): Promise<Result<void, void>> {
    const tenantId = this.tenantContext.requireTenantId();

    const existing = await this.prisma.client.tenantBillingUnit.findMany({
      where: { tenantId },
      select: { id: true, billingUnitId: true },
    });

    const existingIds = new Set(existing.map((row) => row.billingUnitId));
    const incomingIds = new Set(command.billingUnitIds);

    const toCreate = command.billingUnitIds.filter((id) => !existingIds.has(id));
    const toRemove = existing.filter((row) => !incomingIds.has(row.billingUnitId));

    if (toRemove.length > 0) {
      // TODO: guard — check that none of the toRemove billing units are referenced
      // by any ProductType belonging to this tenant. If any are in use, return:
      // return err(new BillingUnitInUseError());
    }

    await this.prisma.client.$transaction([
      ...toCreate.map((billingUnitId) =>
        this.prisma.client.tenantBillingUnit.create({
          data: { tenantId, billingUnitId },
        }),
      ),
      ...toRemove.map((row) =>
        this.prisma.client.tenantBillingUnit.delete({
          where: { id: row.id },
        }),
      ),
    ]);

    return ok(undefined);
  }
}
