import { Permission } from '@repo/types';
import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  CannotReviewNonPendingProfileError,
  CustomerProfileNotFoundError,
} from '../../../domain/errors/customer.errors';
import { ApproveCustomerProfileCommand } from './approve-customer-profile.command';
import { ApproveCustomerProfileRequestDto } from './approve-customer-profile.request.dto';

@StaffRoute(Permission.VIEW_CUSTOMERS)
@Controller('customer-profiles')
export class ApproveCustomerProfileHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() _dto: ApproveCustomerProfileRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(new ApproveCustomerProfileCommand(user.tenantId, id, user.id));

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof CustomerProfileNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CannotReviewNonPendingProfileError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
