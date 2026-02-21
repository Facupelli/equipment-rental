import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { RegisterTenantAndAdminUseCase } from './services/register-tenant-and-admin.use-case';
import { RegisterResponseDto, RegisterTenantAndAdminDto } from '@repo/schemas';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { TenancyService } from './services/tenancy.service';
import { Tenant } from './domain/entities/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReqUser } from '../auth/strategies/jwt.strategy';

@Controller('tenancy')
export class TenancyController {
  constructor(
    private readonly registerUseCase: RegisterTenantAndAdminUseCase,
    private readonly tenancyService: TenancyService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterTenantAndAdminDto): Promise<RegisterResponseDto> {
    const result = await this.registerUseCase.execute(dto);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: ReqUser): Promise<Tenant | null> {
    const result = await this.tenancyService.findById(user.tenantId);
    return result;
  }
}
