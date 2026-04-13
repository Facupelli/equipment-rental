import { Controller, Get, NotFoundException, Param, Res, UnprocessableEntityException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { Permission } from '@repo/types';
import type { Result } from 'neverthrow';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { ContractCustomerProfileMissingError } from 'src/modules/order/domain/errors/contract.errors';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';
import { GenerateOrderContractQuery } from './generate-order-contract.query';
import { GenerateOrderContractResult } from './generate-order-contract.query';

@StaffRoute(Permission.VIEW_ORDERS)
@Controller('orders')
export class GenerateOrderContractHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':orderId/contract')
  async generateContract(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    let result: Result<GenerateOrderContractResult, ContractCustomerProfileMissingError>;

    try {
      result = await this.queryBus.execute(new GenerateOrderContractQuery(user.tenantId, orderId));
    } catch (error) {
      if (error instanceof OrderNotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof ContractCustomerProfileMissingError) {
        throw new UnprocessableEntityException(error.message);
      }

      throw error;
    }

    const { buffer, remitoNumber } = result.value;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="remito-${remitoNumber}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
