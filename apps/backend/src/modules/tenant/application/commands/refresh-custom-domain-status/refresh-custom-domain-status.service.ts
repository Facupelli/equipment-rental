import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';

import { PrismaService } from 'src/core/database/prisma.service';
import { CustomDomainNotFoundError } from 'src/modules/tenant/domain/errors/tenant.errors';
import {
  CloudflareCustomHostname,
  CloudflareCustomHostnameService,
} from 'src/modules/tenant/infrastructure/services/cloudflare-custom-hostname.service';

import { CustomDomainReadModel } from '../../custom-domain.read-model';
import { RefreshCustomDomainStatusCommand } from './refresh-custom-domain-status.command';
import { CustomDomainStatus } from '@repo/types';

type RefreshCustomDomainStatusError = CustomDomainNotFoundError;

interface ProviderState {
  status: CustomDomainStatus;
  lastError: string | null;
}

@Injectable()
@CommandHandler(RefreshCustomDomainStatusCommand)
export class RefreshCustomDomainStatusService implements ICommandHandler<
  RefreshCustomDomainStatusCommand,
  Result<CustomDomainReadModel, RefreshCustomDomainStatusError>
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudflareCustomHostnameService: CloudflareCustomHostnameService,
  ) {}

  async execute(
    command: RefreshCustomDomainStatusCommand,
  ): Promise<Result<CustomDomainReadModel, RefreshCustomDomainStatusError>> {
    const customDomain = await this.prisma.client.customDomain.findUnique({
      where: { tenantId: command.tenantId },
      select: {
        tenantId: true,
        domain: true,
        cfHostnameId: true,
      },
    });

    if (!customDomain) {
      return err(new CustomDomainNotFoundError(command.tenantId));
    }

    if (!customDomain.cfHostnameId) {
      throw new Error(`Custom domain '${customDomain.domain}' is missing a Cloudflare hostname id`);
    }

    const providerHostname = await this.cloudflareCustomHostnameService.getCustomHostname(customDomain.cfHostnameId);
    const providerState = this.mapProviderState(providerHostname);

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const verifiedAt = providerState.status === CustomDomainStatus.ACTIVE ? new Date() : null;

      await tx.customDomain.update({
        where: { tenantId: command.tenantId },
        data: {
          status: providerState.status,
          verifiedAt,
          lastError: providerState.lastError,
        },
      });

      await tx.tenant.update({
        where: { id: command.tenantId },
        data: {
          customDomain: providerState.status === CustomDomainStatus.ACTIVE ? customDomain.domain : null,
        },
      });

      return tx.customDomain.findUnique({
        where: { tenantId: command.tenantId },
        select: {
          domain: true,
          status: true,
          verifiedAt: true,
          lastError: true,
        },
      });
    });

    if (!updated) {
      throw new Error(`Custom domain '${customDomain.domain}' disappeared during refresh`);
    }

    return ok({
      domain: updated.domain,
      status: updated.status as CustomDomainStatus,
      verifiedAt: updated.verifiedAt,
      lastError: updated.lastError,
    });
  }

  private mapProviderState(providerHostname: CloudflareCustomHostname): ProviderState {
    const errors = [...providerHostname.validationErrors, ...providerHostname.ownershipVerificationErrors];
    const combinedError = errors.length > 0 ? errors.join('; ') : null;
    const providerStatus = providerHostname.status?.toLowerCase() ?? null;
    const sslStatus = providerHostname.sslStatus?.toLowerCase() ?? null;

    if (sslStatus === 'active') {
      return {
        status: CustomDomainStatus.ACTIVE,
        lastError: null,
      };
    }

    if (
      providerStatus === 'deleted' ||
      providerStatus === 'blocked' ||
      providerStatus === 'moved' ||
      sslStatus === 'deleted' ||
      sslStatus === 'deactivated' ||
      sslStatus === 'validation_timed_out'
    ) {
      return {
        status: CustomDomainStatus.FAILED,
        lastError: combinedError || 'Cloudflare reported the custom hostname as unavailable',
      };
    }

    if (sslStatus === 'pending_validation' || combinedError) {
      return {
        status: CustomDomainStatus.ACTION_REQUIRED,
        lastError: combinedError || 'Cloudflare is waiting for DNS validation',
      };
    }

    return {
      status: CustomDomainStatus.PENDING,
      lastError: null,
    };
  }
}
