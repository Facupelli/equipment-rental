import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterResponseDto, RegisterTenantAndAdminDto } from '@repo/schemas';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenancyService } from '../../application/tenancy.service';
import { RegisterTenantAndAdminUseCase } from '../../application/use-cases/register-tenant-and-admin.use-case';
import { Public } from 'src/modules/auth/infrastructure/is-public.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

@Controller('tenancy')
export class TenancyController {
  constructor(
    private readonly registerUseCase: RegisterTenantAndAdminUseCase,
    private readonly tenancyService: TenancyService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterTenantAndAdminDto): Promise<RegisterResponseDto> {
    const result = await this.registerUseCase.execute(dto);
    return result;
  }

  @Get('me')
  async me(@CurrentUser() user: ReqUser): Promise<Tenant | null> {
    const result = await this.tenancyService.findById(user.tenantId);
    return result;
  }
}
