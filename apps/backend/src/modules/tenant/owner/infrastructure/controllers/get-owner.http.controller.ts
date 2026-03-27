import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetOwnerResponseDto } from '@repo/schemas';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { ReqUser } from 'src/modules/auth/infrastructure/strategies/jwt.strategy';

import { GetOwnerQuery } from '../../application/queries/get-owner/get-owner.query';

@Controller('owners')
export class GetOwnerHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':ownerId')
  async getOwner(@CurrentUser() user: ReqUser, @Param('ownerId') ownerId: string): Promise<GetOwnerResponseDto> {
    const owner = await this.queryBus.execute<GetOwnerQuery, GetOwnerResponseDto | null>(
      new GetOwnerQuery(user.tenantId, ownerId),
    );

    if (!owner) {
      throw new NotFoundException(`Owner with id ${ownerId} not found`);
    }

    return owner;
  }
}
