import { Body, Controller, Get, HttpCode, HttpStatus, Post, ConflictException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { TenancyService } from '../../application/tenancy.service';
import { Public } from 'src/modules/auth/infrastructure/is-public.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreateTenantUserDto } from '../../application/dto/create-tenant-user.dto';
import { CreateTenantUserCommand } from '../../application/commands/create-tenant-user.command';
import { TenantWithBillingUnits } from '@repo/schemas';
import { EmailAlreadyInUseError, CompanyNameAlreadyInUseError } from '../../application/errors/tenant-user.errors';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly tenancyService: TenancyService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateTenantUserDto): Promise<{ userId: string; tenantId: string }> {
    const command = new CreateTenantUserCommand(dto.user, dto.tenant);
    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;
      if (error instanceof EmailAlreadyInUseError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof CompanyNameAlreadyInUseError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    return result.value;
  }

  @Get('me')
  async me(@CurrentUser() user: ReqUser): Promise<TenantWithBillingUnits> {
    const result = await this.tenancyService.findById(user.tenantId);
    return result;
  }
}
