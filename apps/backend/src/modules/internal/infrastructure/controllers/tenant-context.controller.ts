import { Controller, Get, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { InternalTokenGuard } from '../guards/internal-token.guard';
import { BANNED_TENANT_SLUGS } from 'src/modules/tenant/domain/tenant.constants';
import { ResolvedTenantContext, TenantContext } from '@repo/schemas';
import { FindTenantBySlugQuery } from 'src/modules/tenant/application/queries/find-tenant-by-slug/find-tenant-by-slug.query';
import { FindTenantByCustomDomainQuery } from 'src/modules/tenant/application/queries/find-tenant-by-custom-domain/find-tenant-by-custom-domain.query';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/config/env.schema';

@Controller('internal')
@UseGuards(InternalTokenGuard)
export class TenantContextController {
  private readonly rootDomain: string;
  private readonly adminHostname: string;

  constructor(
    private readonly configService: ConfigService<Env, true>,
    private readonly queryBus: QueryBus,
  ) {
    const rootDomain = this.configService.get('ROOT_DOMAIN');

    this.rootDomain = rootDomain;
    this.adminHostname = `app.${rootDomain}`;
  }

  @Get('tenant-context')
  async resolve(@Query('hostname') raw: string): Promise<ResolvedTenantContext> {
    const hostname = this.normalize(raw);

    // Path 1 — admin face, no tenant needed
    if (hostname === this.adminHostname) {
      return { face: 'admin' };
    }

    // Path 2 — subdomain of root domain, resolve by slug
    if (hostname.endsWith(`.${this.rootDomain}`)) {
      const slug = hostname.replace(`.${this.rootDomain}`, '');
      return this.resolveBySlug(slug);
    }

    // Path 3 — custom domain lookup
    return this.resolveByCustomDomain(hostname);
  }

  // --- private helpers ---

  private normalize(hostname: string): string {
    return hostname.toLowerCase().trim().split(':')[0]; // strip port for local dev (e.g. localhost:3000)
  }

  private async resolveBySlug(slug: string): Promise<ResolvedTenantContext> {
    if (BANNED_TENANT_SLUGS.includes(slug)) {
      throw new NotFoundException(`No tenant found for slug: ${slug}`);
    }

    const tenant = await this.queryBus.execute<FindTenantBySlugQuery, TenantContext | null>(
      new FindTenantBySlugQuery(slug),
    );

    if (!tenant) {
      throw new NotFoundException(`No tenant found for slug: ${slug}`);
    }

    return { face: 'portal', tenant };
  }

  private async resolveByCustomDomain(domain: string): Promise<ResolvedTenantContext> {
    const tenant = await this.queryBus.execute<FindTenantByCustomDomainQuery, TenantContext | null>(
      new FindTenantByCustomDomainQuery(domain),
    );

    if (!tenant) {
      throw new NotFoundException(`No tenant found for custom domain: ${domain}`);
    }

    return { face: 'portal', tenant };
  }
}
