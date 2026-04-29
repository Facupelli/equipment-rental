import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';
import { Result } from 'neverthrow';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import { OrderNotFoundError } from 'src/modules/order/domain/errors/order.errors';

import { PrepareOrderContractForSigningCommand } from './prepare-order-contract-for-signing.command';
import {
  PrepareOrderContractForSigningBodyDto,
  PrepareOrderContractForSigningParamDto,
} from './prepare-order-contract-for-signing.request.dto';
import { PrepareOrderContractForSigningResponseDto } from './prepare-order-contract-for-signing.response.dto';
import { PrepareOrderContractForSigningResult } from './prepare-order-contract-for-signing.service';

@StaffRoute(Permission.CONFIRM_ORDERS)
@Controller('orders/:orderId/contract/signing-session')
export class PrepareOrderContractForSigningHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async prepare(
    @Param() params: PrepareOrderContractForSigningParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PrepareOrderContractForSigningBodyDto,
  ): Promise<PrepareOrderContractForSigningResponseDto> {
    const result = await this.commandBus.execute<
      PrepareOrderContractForSigningCommand,
      Result<PrepareOrderContractForSigningResult, ContractCustomerProfileMissingError | OrderNotFoundError>
    >(
      new PrepareOrderContractForSigningCommand({
        tenantId: user.tenantId,
        orderId: params.orderId,
        recipientEmail: body.recipientEmail,
        rawToken: body.rawToken,
        expiresAt: body.expiresAt,
      }),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof OrderNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ContractCustomerProfileMissingError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Contract Signing Not Allowed',
          error.message,
          'errors://contract-signing-not-allowed',
        );
      }

      throw error;
    }

    return {
      sessionId: result.value.sessionId,
      documentNumber: result.value.documentNumber,
      fileName: result.value.fileName,
      unsignedDocumentHash: result.value.unsignedDocumentHash,
      reusedExistingSession: result.value.reusedExistingSession,
      pdfBase64: result.value.buffer.toString('base64'),
    };
  }
}
