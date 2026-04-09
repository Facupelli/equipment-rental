import { Permission } from '@repo/types';
import {
  BadRequestException,
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
  RejectionReasonRequiredError,
} from '../../../domain/errors/customer.errors';
import { RejectCustomerProfileCommand } from './reject-customer-profile.command';
import { RejectCustomerProfileRequestDto } from './reject-customer-profile.request.dto';

@StaffRoute(Permission.VIEW_CUSTOMERS)
@Controller('customer-profiles')
export class RejectCustomerProfileHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post(':id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectCustomerProfileRequestDto,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new RejectCustomerProfileCommand(user.tenantId, id, user.id, dto.reason),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof CustomerProfileNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CannotReviewNonPendingProfileError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof RejectionReasonRequiredError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
