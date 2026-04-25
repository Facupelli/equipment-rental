import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';

import {
  GetDraftOrderPricingProposalParamDto,
  GetDraftOrderPricingProposalRequestDto,
} from './get-draft-order-pricing-proposal.request.dto';
import { GetDraftOrderPricingProposalQuery } from './get-draft-order-pricing-proposal.query';
import { GetDraftOrderPricingProposalResponseDto } from './get-draft-order-pricing-proposal.response.dto';
import {
  OrderNotFoundError,
  OrderPricingAdjustmentNotAllowedError,
  OrderPricingTargetTotalInvalidError,
} from '../../../domain/errors/order.errors';

@StaffRoute(Permission.CREATE_ORDERS)
@Controller('orders/:orderId/draft-pricing/proposal')
export class GetDraftOrderPricingProposalHttpController {
  constructor(private readonly queryBus: QueryBus) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async getProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: GetDraftOrderPricingProposalParamDto,
    @Body() dto: GetDraftOrderPricingProposalRequestDto,
  ): Promise<GetDraftOrderPricingProposalResponseDto> {
    const result = await this.queryBus.execute<
      GetDraftOrderPricingProposalQuery,
      | GetDraftOrderPricingProposalResponseDto
      | OrderNotFoundError
      | OrderPricingAdjustmentNotAllowedError
      | OrderPricingTargetTotalInvalidError
    >(new GetDraftOrderPricingProposalQuery(user.tenantId, params.orderId, dto.targetTotal));

    if (result instanceof OrderNotFoundError) {
      throw new NotFoundException(result.message);
    }

    if (result instanceof OrderPricingAdjustmentNotAllowedError) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Draft Pricing Not Allowed',
        result.message,
        'errors://draft-pricing-not-allowed',
      );
    }

    if (result instanceof OrderPricingTargetTotalInvalidError) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Invalid Draft Pricing Target',
        result.message,
        'errors://invalid-draft-pricing-target',
      );
    }

    return result;
  }
}
