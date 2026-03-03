import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { TenancyService } from '../../application/tenancy.service';
import { Public } from 'src/modules/auth/infrastructure/is-public.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreateTenantUserDto } from '../../application/dto/create-tenant-user.dto';
import { CreateTenantUserUseCase } from '../../application/create-tenant-user.use-case';
import { TenantWithBillingUnits } from '@repo/schemas';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly createTenantUserUseCase: CreateTenantUserUseCase,
    private readonly tenancyService: TenancyService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateTenantUserDto): Promise<{ userId: string; tenantId: string }> {
    const result = await this.createTenantUserUseCase.execute(dto);
    return result;
  }

  @Get('me')
  async me(@CurrentUser() user: ReqUser): Promise<TenantWithBillingUnits> {
    const result = await this.tenancyService.findById(user.tenantId);
    return result;
  }
}
