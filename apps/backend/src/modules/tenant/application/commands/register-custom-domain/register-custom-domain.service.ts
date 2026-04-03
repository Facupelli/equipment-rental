import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { err, ok, Result } from 'neverthrow';
import { Prisma } from 'src/generated/prisma/client';
import { CustomDomainStatus } from 'src/generated/prisma/client';

import { PrismaService } from 'src/core/database/prisma.service';
import { Env } from 'src/config/env.schema';
import { normalizeAndValidateCustomDomain } from 'src/modules/tenant/domain/custom-domain';
import {
  CustomDomainAlreadyInUseError,
  InvalidCustomDomainError,
  TenantAlreadyHasCustomDomainError,
  TenantNotFoundError,
  UnsupportedApexCustomDomainError,
} from 'src/modules/tenant/domain/errors/tenant.errors';
import { CloudflareCustomHostnameService } from 'src/modules/tenant/infrastructure/services/cloudflare-custom-hostname.service';

import { RegisterCustomDomainCommand } from './register-custom-domain.command';

export interface RegisterCustomDomainResult {
  domain: string;
  status: CustomDomainStatus;
  cnameTarget: string;
}

type RegisterCustomDomainError =
  | InvalidCustomDomainError
  | UnsupportedApexCustomDomainError
  | CustomDomainAlreadyInUseError
  | TenantAlreadyHasCustomDomainError
  | TenantNotFoundError;

@Injectable()
@CommandHandler(RegisterCustomDomainCommand)
export class RegisterCustomDomainService implements ICommandHandler<
  RegisterCustomDomainCommand,
  Result<RegisterCustomDomainResult, RegisterCustomDomainError>
> {
  private readonly rootDomain: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<Env, true>,
    private readonly cloudflareCustomHostnameService: CloudflareCustomHostnameService,
  ) {
    this.rootDomain = this.configService.get('ROOT_DOMAIN');
  }

  async execute(
    command: RegisterCustomDomainCommand,
  ): Promise<Result<RegisterCustomDomainResult, RegisterCustomDomainError>> {
    const normalizedDomainResult = normalizeAndValidateCustomDomain(command.domain, this.rootDomain);

    if (normalizedDomainResult.isErr()) {
      return err(normalizedDomainResult.error);
    }

    const normalizedDomain = normalizedDomainResult.value;

    const [tenant, existingCustomDomain, existingTenantForDomain] = await Promise.all([
      this.prisma.client.tenant.findUnique({
        where: { id: command.tenantId },
        select: { id: true, customDomain: true },
      }),
      this.prisma.client.customDomain.findUnique({
        where: { tenantId: command.tenantId },
        select: { domain: true },
      }),
      this.prisma.client.tenant.findFirst({
        where: {
          customDomain: normalizedDomain,
          NOT: { id: command.tenantId },
        },
        select: { id: true },
      }),
    ]);

    if (!tenant) {
      return err(new TenantNotFoundError(command.tenantId));
    }

    if (tenant.customDomain) {
      return err(new TenantAlreadyHasCustomDomainError(command.tenantId, tenant.customDomain));
    }

    if (existingCustomDomain) {
      return err(new TenantAlreadyHasCustomDomainError(command.tenantId, existingCustomDomain.domain));
    }

    if (existingTenantForDomain) {
      return err(new CustomDomainAlreadyInUseError(normalizedDomain));
    }

    const domainOwner = await this.prisma.client.customDomain.findUnique({
      where: { domain: normalizedDomain },
      select: { tenantId: true },
    });

    if (domainOwner && domainOwner.tenantId !== command.tenantId) {
      return err(new CustomDomainAlreadyInUseError(normalizedDomain));
    }

    const providerHostname = await this.cloudflareCustomHostnameService.createCustomHostname(normalizedDomain);

    try {
      await this.prisma.client.customDomain.create({
        data: {
          tenantId: command.tenantId,
          domain: normalizedDomain,
          cfHostnameId: providerHostname.id,
          status: CustomDomainStatus.PENDING,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

        if (target.includes('tenant_id')) {
          return err(new TenantAlreadyHasCustomDomainError(command.tenantId));
        }

        if (target.includes('domain')) {
          return err(new CustomDomainAlreadyInUseError(normalizedDomain));
        }
      }

      throw error;
    }

    return ok({
      domain: normalizedDomain,
      status: CustomDomainStatus.PENDING,
      cnameTarget: `customers.${this.rootDomain}`,
    });
  }
}
