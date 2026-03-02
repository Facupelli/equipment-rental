import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { TenancyService } from '../../application/tenancy.service';
import { Public } from 'src/modules/auth/infrastructure/is-public.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';
import { CreateTenantUserDto, CreateTenantUserResponseDto } from '../../application/dto/create-tenant-user.dto';
import { TenantResponseDto } from '@repo/schemas';
import { CreateTenantUserUseCase } from '../../application/create-tenant-user.use-case';

@Controller('tenancy')
export class TenancyController {
  constructor(
    private readonly createTenantUserUseCase: CreateTenantUserUseCase,
    private readonly tenancyService: TenancyService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateTenantUserDto): Promise<CreateTenantUserResponseDto> {
    const result = await this.createTenantUserUseCase.execute(dto);
    return result;
  }

  @Get('me')
  async me(@CurrentUser() user: ReqUser): Promise<TenantResponseDto> {
    const result = await this.tenancyService.findById(user.tenantId);

    if (!result) {
      throw new NotFoundException('Tenant not found');
    }

    return result;
  }
}
