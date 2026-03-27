import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { GetOwnersQuery } from '../../application/queries/get-owners/get-owners.query';

@Controller('owners')
export class GetOwnersHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getOwners(@CurrentUser() user: ReqUser) {
    return this.queryBus.execute(new GetOwnersQuery(user.tenantId));
  }
}
