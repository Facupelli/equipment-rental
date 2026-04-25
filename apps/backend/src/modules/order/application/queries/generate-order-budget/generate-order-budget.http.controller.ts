import { Body, Controller, HttpStatus, NotFoundException, Param, Post, Res } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { generateOrderBudgetRequestSchema } from '@repo/schemas';
import { Permission } from '@repo/types';
import { Response } from 'express';
import type { Result } from 'neverthrow';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { OrderBudgetMustBeDraftError } from 'src/modules/order/domain/errors/contract.errors';
import { OrderNotFoundException } from 'src/modules/order/domain/exceptions/order.exceptions';

import { GenerateOrderBudgetQuery, GenerateOrderBudgetResult } from './generate-order-budget.query';
import { GenerateOrderBudgetParamDto, GenerateOrderBudgetRequestDto } from './generate-order-budget.request.dto';

@StaffRoute(Permission.VIEW_ORDERS)
@Controller('orders/:orderId/presupuesto')
export class GenerateOrderBudgetHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Post()
  async previewBudget(
    @Param() params: GenerateOrderBudgetParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const dto: GenerateOrderBudgetRequestDto = generateOrderBudgetRequestSchema.parse(body ?? {});

    await this.sendBudgetResponse({
      orderId: params.orderId,
      tenantId: user.tenantId,
      customer: dto.customer,
      res,
      disposition: 'inline',
    });
  }

  @Post('download')
  async downloadBudget(
    @Param() params: GenerateOrderBudgetParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const dto: GenerateOrderBudgetRequestDto = generateOrderBudgetRequestSchema.parse(body ?? {});

    await this.sendBudgetResponse({
      orderId: params.orderId,
      tenantId: user.tenantId,
      customer: dto.customer,
      res,
      disposition: 'attachment',
    });
  }

  private async sendBudgetResponse({
    orderId,
    tenantId,
    customer,
    res,
    disposition,
  }: {
    orderId: string;
    tenantId: string;
    customer: GenerateOrderBudgetRequestDto['customer'];
    res: Response;
    disposition: 'inline' | 'attachment';
  }): Promise<void> {
    let result: Result<GenerateOrderBudgetResult, OrderBudgetMustBeDraftError>;

    try {
      result = await this.queryBus.execute(new GenerateOrderBudgetQuery(tenantId, orderId, customer));
    } catch (error) {
      if (error instanceof OrderNotFoundException) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

    if (result.isErr()) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Budget Generation Not Allowed',
        result.error.message,
        'errors://budget-generation-not-allowed',
      );
    }

    const { buffer, downloadFileName } = result.value;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${downloadFileName}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
