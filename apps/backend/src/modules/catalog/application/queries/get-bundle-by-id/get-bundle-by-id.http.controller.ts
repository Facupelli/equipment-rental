import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Permission } from '@repo/types';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { GetBundleByIdQuery } from './get-bundle-by-id.query';
import { GetBundleByIdResponseDto } from './get-bundle-by-id.response.dto';

@StaffRoute(Permission.VIEW_BUNDLES)
@Controller('bundles')
export class GetBundleByIdHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<GetBundleByIdResponseDto> {
    const result = await this.queryBus.execute(new GetBundleByIdQuery(user.tenantId, id));

    if (!result) {
      throw new NotFoundException('Bundle not found');
    }

    return result;
  }
}
