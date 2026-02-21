import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterTenantAndAdminUseCase } from './services/register-tenant-and-admin.use-case';
import { RegisterResponseDto, RegisterTenantAndAdminDto } from '@repo/schemas';

@Controller('tenancy')
export class TenancyController {
  constructor(private readonly registerUseCase: RegisterTenantAndAdminUseCase) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterTenantAndAdminDto): Promise<RegisterResponseDto> {
    const result = await this.registerUseCase.execute(dto);
    return result;
  }
}
