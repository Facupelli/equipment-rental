import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Public } from 'src/modules/auth/infrastructure/is-public.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreateTenantUserDto } from '../../application/dto/create-tenant-user.dto';
import { CreateTenantUserCommand } from '../../application/commands/create-tenant-user.command';
import { TenantWithBillingUnits } from '@repo/schemas';
import { EmailAlreadyInUseError, CompanyNameAlreadyInUseError } from '../../application/errors/tenant-user.errors';
import { GetTenantQuery } from '../../application/queries/get-tenant.query';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateTenantUserDto): Promise<{ userId: string; tenantId: string }> {
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
    const user = await this.queryBus.execute<GetTenantQuery, TenantWithBillingUnits | null>(
      new GetTenantQuery(reqUser.tenantId),
    );

    if (!user) {
      throw new NotFoundException('Tenant not found');
    }

    return user;
  }
}
