import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
  Request,
  Req,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { TenantContext } from '@repo/schemas';
import { ActorType } from '@repo/types';
import { Request as ExpressRequest } from 'express';

import { Env } from 'src/config/env.schema';
import { Public } from 'src/core/decorators/public.decorator';
import { TenantContextService } from 'src/modules/shared/tenant/tenant-context.service';
import { FindTenantByIdQuery } from 'src/modules/tenant/public/queries/find-tenant-by-id.query';

import { AuthService } from '../../application/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { LocalCustomerAuthGuard } from '../guards/local-customer-auth.guard';
import { RefreshTokenGuard } from '../guards/jwt-refresh.guard';
import { RefreshTokenUser } from '../strategies/jwt-refresh.strategy';
import { CustomerLocalUser } from '../strategies/local-customer.strategy';
import { UserLocalUser } from '../strategies/local.strategy';
import { RegisterCustomerCommand } from '../../application/commands/register-customer/regsiter-customer.command';
import { RegisterCustomerDto } from '../../application/dto/register-customer.dto';
import { AuthenticatedUser } from '../../public/authenticated-user';
import { IssueCustomerGoogleAuthStateRequestDto } from '../../application/dto/issue-customer-google-auth-state.request.dto';
import { GoogleAuthStateService } from '../services/google-auth-state.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly authService: AuthService,
    private readonly googleAuthStateService: GoogleAuthStateService,
    private readonly tenantContext: TenantContextService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  // ── User (back-office) ────────────────────────────────────────────────────

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Request() req: { user: UserLocalUser }) {
    const { accessToken, refreshToken } = await this.authService.login({
      id: req.user.id,
      email: req.user.email,
      tenantId: req.user.tenantId,
      actorType: ActorType.USER,
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  // ── Customer (booking portal) ─────────────────────────────────────────────

  @Public()
  @UseGuards(LocalCustomerAuthGuard)
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  async loginCustomer(@Request() req: { user: CustomerLocalUser }) {
    const { accessToken, refreshToken } = await this.authService.login(req.user);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Public()
  @Post('customer/register')
  @HttpCode(HttpStatus.OK)
  async registerCustomer(@Body() dto: RegisterCustomerDto) {
    const customerId = await this.commandBus.execute(
      new RegisterCustomerCommand(
        dto.tenantId,
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
        dto.isCompany,
        dto.companyName,
      ),
    );

    return customerId;
  }

  @Public()
  @Post('customer/google/state')
  @HttpCode(HttpStatus.OK)
  async issueCustomerGoogleState(@Body() dto: IssueCustomerGoogleAuthStateRequestDto, @Req() req: ExpressRequest) {
    const tenantId = this.tenantContext.requireTenantId();
    const tenant = await this.queryBus.execute<FindTenantByIdQuery, TenantContext | null>(
      new FindTenantByIdQuery(tenantId),
    );

    if (!tenant) {
      throw new BadRequestException(`No active tenant found for id: ${tenantId}`);
    }

    return {
      state: this.googleAuthStateService.issueState({
        tenantId,
        portalOrigin: this.resolveTrustedPortalOrigin(req, tenant),
        redirectPath: dto.redirectPath,
      }),
    };
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: { user: RefreshTokenUser }) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      req.user.actorId,
      req.user.actorType,
      req.user.tokenId,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: { user: AuthenticatedUser }) {
    await this.authService.logout(req.user.id, req.user.actorType);
  }

  private resolveTrustedPortalOrigin(req: ExpressRequest, tenant: TenantContext): string {
    const hostname = this.normalizeHostname(req.headers.host);
    const allowedHostnames = new Set([`${tenant.slug}.${this.configService.get('ROOT_DOMAIN')}`]);

    if (tenant.customDomain) {
      allowedHostnames.add(tenant.customDomain);
    }

    if (!allowedHostnames.has(hostname)) {
      throw new BadRequestException('Request hostname does not match the current tenant portal hostname.');
    }

    return `${this.resolveTrustedPortalProtocol(req, hostname)}://${hostname}`;
  }

  private resolveTrustedPortalProtocol(req: ExpressRequest, hostname: string): string {
    if (hostname !== 'localhost' && !hostname.endsWith('.localhost')) {
      return 'https';
    }

    const forwardedProto = req.headers['x-forwarded-proto'];

    if (typeof forwardedProto === 'string' && forwardedProto.length > 0) {
      return forwardedProto.split(',')[0].trim();
    }

    if (Array.isArray(forwardedProto) && typeof forwardedProto[0] === 'string' && forwardedProto[0].length > 0) {
      return forwardedProto[0].split(',')[0].trim();
    }

    return req.protocol;
  }

  private normalizeHostname(hostHeader: string | undefined): string {
    if (!hostHeader) {
      throw new BadRequestException('Request hostname is required.');
    }

    return hostHeader.toLowerCase().trim().split(':')[0];
  }
}
