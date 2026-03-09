import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  ConflictException,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Public } from 'src/modules/auth/infrastructure/is-public.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { RegisterDto } from '../../application/dto/create-tenant-user.dto';
import { CreateTenantUserCommand } from '../../application/commands/create-tenant-user.command';
import { EmailAlreadyInUseError, CompanyNameAlreadyInUseError } from '../../application/errors/tenant-user.errors';
import { GetTenantQuery } from '../../application/queries/get-tenant/get-tenant.query';
import { GetTenantBillingUnitsQuery } from '../../application/queries/get-billing-units/get-tenant-billing-units.query';
import { SyncTenantBillingUnitsCommand } from '../../application/commands/create-billing-unit/sync-billing-units.command-handler';
import { SyncTenantBillingUnitsDto } from '../../application/dto/create-tenant-billing-unit.dto';
import { TenantBillingUnitListResponse, TenantResponse } from '@repo/schemas';
import { UpdateTenantConfigCommand } from '../../application/commands/update-config/update-config.command';
import { UpdateTenantConfigDto } from '../../application/dto/update-config.dto';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<{ userId: string; tenantId: string }> {
    const command = new CreateTenantUserCommand(dto.user, dto.tenant);
    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof EmailAlreadyInUseError || error instanceof CompanyNameAlreadyInUseError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    return result.value;
  }

  @Get('me')
  async me(@CurrentUser() reqUser: ReqUser) {
    const tenant = await this.queryBus.execute<GetTenantQuery, TenantResponse | null>(
      new GetTenantQuery(reqUser.tenantId),
    );

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  @Patch('config')
  async updateConfig(@Body() dto: UpdateTenantConfigDto): Promise<void> {
    await this.commandBus.execute(new UpdateTenantConfigCommand(dto));
  }

  @Get('billing-units')
  async getBillingUnits() {
    const billingUnits = await this.queryBus.execute<GetTenantBillingUnitsQuery, TenantBillingUnitListResponse | null>(
      new GetTenantBillingUnitsQuery(),
    );

    return billingUnits;
  }

  @Post('billing-units')
  async createBillingUnit(@Body() dto: SyncTenantBillingUnitsDto) {
    const result = await this.commandBus.execute<SyncTenantBillingUnitsCommand, string>(
      new SyncTenantBillingUnitsCommand(dto.billingUnitIds),
    );

    return result;
  }
}
