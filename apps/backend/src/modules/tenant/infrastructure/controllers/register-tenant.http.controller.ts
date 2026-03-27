import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { Public } from 'src/core/decorators/public.decorator';

import { RegisterTenantCommand } from '../../application/commands/register-tenant/register-tenant.command';
import { CompanyNameAlreadyInUseError, EmailAlreadyInUseError } from '../../domain/errors/tenant.errors';
import { RegisterTenantRequestDto } from '../../application/commands/register-tenant/register-tenant.request.dto';
import { RegisterTenantResponseDto } from '../../application/commands/register-tenant/register-tenant.response.dto';

@Controller('tenants')
export class RegisterTenantHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterTenantRequestDto): Promise<RegisterTenantResponseDto> {
    const command = new RegisterTenantCommand(dto.user, dto.tenant);
    const result = await this.commandBus.execute(command);

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof EmailAlreadyInUseError || error instanceof CompanyNameAlreadyInUseError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }

    return result.value as RegisterTenantResponseDto;
  }
}
