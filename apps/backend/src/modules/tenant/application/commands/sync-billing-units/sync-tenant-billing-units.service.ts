import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SyncTenantBillingUnitsCommand } from './sync-tenant-billing-units.command';
import { PrismaService } from 'src/core/database/prisma.service';

@CommandHandler(SyncTenantBillingUnitsCommand)
export class SyncTenantBillingUnitsService implements ICommandHandler<SyncTenantBillingUnitsCommand, void> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: SyncTenantBillingUnitsCommand): Promise<void> {
    const existing = await this.prisma.client.tenantBillingUnit.findMany({
      where: { tenantId: command.tenantId },
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
          data: { tenantId: command.tenantId, billingUnitId },
        }),
      ),
      ...toRemove.map((row) =>
        this.prisma.client.tenantBillingUnit.delete({
          where: { id: row.id },
        }),
      ),
    ]);
  }
}
