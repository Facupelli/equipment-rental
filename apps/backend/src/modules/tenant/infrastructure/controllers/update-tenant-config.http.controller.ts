import { Body, Controller, NotFoundException, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { UpdateTenantConfigCommand } from '../../application/commands/update-config/update-config.command';
import { UpdateTenantConfigDto } from '../../application/commands/update-config/update-config.request.dto';
import { TenantNotFoundError } from '../../domain/errors/tenant.errors';

@Controller('tenants')
export class UpdateTenantConfigHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch('config')
  async updateConfig(@CurrentUser() user: ReqUser, @Body() dto: UpdateTenantConfigDto): Promise<void> {
    const result = await this.commandBus.execute(new UpdateTenantConfigCommand(user.tenantId, dto));

    if (result.isErr()) {
      if (result.error instanceof TenantNotFoundError) {
        throw new NotFoundException(result.error.message);
      }

      throw result.error;
    }
  }
}
