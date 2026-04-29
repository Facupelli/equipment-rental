import {
  BadGatewayException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { Result } from 'neverthrow';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { SigningDocumentType } from 'src/generated/prisma/client';
import { SendSigningInvitationResult } from '../../document-signing.facade';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import {
  OrderNotFoundError,
  OrderSigningAllowedOnlyForConfirmedOrdersError,
} from 'src/modules/order/domain/errors/order.errors';
import {
  SigningInvitationEmailDeliveryFailedError,
  SigningInvitationRecipientEmailRequiredError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';

import { SendSigningInvitationCommand } from './send-signing-invitation.command';
import { SendSigningInvitationBodyDto, SendSigningInvitationParamDto } from './send-signing-invitation.request.dto';
import { SendSigningInvitationResponseDto } from './send-signing-invitation.response.dto';
import { SendSigningInvitationCommandError } from './send-signing-invitation.service';

@StaffRoute(Permission.CONFIRM_ORDERS)
@Controller('document-signing/orders/:orderId/sessions')
export class SendSigningInvitationHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendInvitation(
    @Param() params: SendSigningInvitationParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SendSigningInvitationBodyDto,
  ): Promise<SendSigningInvitationResponseDto> {
    const result = await this.commandBus.execute<
      SendSigningInvitationCommand,
      Result<SendSigningInvitationResult, SendSigningInvitationCommandError>
    >(
      new SendSigningInvitationCommand(
        user.tenantId,
        params.orderId,
        SigningDocumentType.RENTAL_AGREEMENT,
        body.recipientEmail,
      ),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof ContractCustomerProfileMissingError ||
        error instanceof OrderSigningAllowedOnlyForConfirmedOrdersError ||
        error instanceof SigningInvitationRecipientEmailRequiredError
      ) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Signing Invitation Not Allowed',
          error.message,
          'errors://signing-invitation-not-allowed',
        );
      }

      if (error instanceof SigningInvitationEmailDeliveryFailedError) {
        throw new BadGatewayException(error.message);
      }

      throw error;
    }

    return result.value;
  }
}
