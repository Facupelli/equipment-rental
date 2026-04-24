import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FulfillmentMethod, Permission } from '@repo/types';

import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { StaffRoute } from 'src/core/decorators/staff-route.decorator';
import { ProblemException } from 'src/core/exceptions/problem.exception';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import { CouponNotFoundError, CouponValidationError } from 'src/modules/pricing/pricing.public-api';

import { CreateDraftOrderCommand } from './create-draft-order.command';
import { CreateDraftOrderRequestDto } from './create-draft-order.request.dto';
import { CreateDraftOrderResponseDto } from './create-draft-order.response.dto';
import {
  BundleNotFoundError,
  DeliveryNotSupportedForLocationError,
  InvalidBookingLocationError,
  InvalidPickupSlotError,
  InvalidReturnSlotError,
  OrderMustContainItemsError,
  ProductTypeNotFoundError,
} from '../../../domain/errors/order.errors';

@StaffRoute(Permission.CREATE_ORDERS)
@Controller('orders/drafts')
export class CreateDraftOrderHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDraftOrderRequestDto,
  ): Promise<CreateDraftOrderResponseDto> {
    const result = await this.commandBus.execute(
      new CreateDraftOrderCommand({
        tenantId: user.tenantId,
        locationId: dto.locationId,
        customerId: dto.customerId ?? undefined,
        pickupDate: dto.pickupDate,
        returnDate: dto.returnDate,
        pickupTime: dto.pickupTime,
        returnTime: dto.returnTime,
        items: dto.items,
        currency: dto.currency,
        insuranceSelected: dto.insuranceSelected,
        couponCode: dto.couponCode,
        fulfillmentMethod: dto.fulfillmentMethod as FulfillmentMethod,
        deliveryRequest: dto.deliveryRequest ?? undefined,
      }),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof OrderMustContainItemsError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Draft Order',
          error.message,
          'errors://draft-order-must-contain-items',
        );
      }

      if (error instanceof InvalidPickupSlotError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Pickup Slot',
          error.message,
          'errors://invalid-pickup-slot',
        );
      }

      if (error instanceof InvalidReturnSlotError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Return Slot',
          error.message,
          'errors://invalid-return-slot',
        );
      }

      if (error instanceof InvalidBookingLocationError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Booking Context',
          error.message,
          'errors://invalid-booking-context',
        );
      }

      if (error instanceof DeliveryNotSupportedForLocationError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Delivery Not Supported',
          error.message,
          'errors://delivery-not-supported',
        );
      }

      if (error instanceof CouponNotFoundError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Coupon Not Found',
          error.message,
          'errors://coupon-not-found',
        );
      }

      if (error instanceof CouponValidationError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Coupon Validation Failed',
          error.message,
          'errors://coupon-validation-failed',
          { reason: error.reason },
        );
      }

      if (error instanceof ProductTypeInactiveForBookingError || error instanceof BundleInactiveForBookingError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Inactive Catalog Item',
          error.message,
          'errors://inactive-catalog-item',
        );
      }

      if (error instanceof ProductTypeNotBookableAtLocationError || error instanceof BundleNotBookableAtLocationError) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid Booking Context',
          error.message,
          'errors://invalid-booking-context',
        );
      }

      if (error instanceof ProductTypeNotFoundError || error instanceof BundleNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

    return result.value;
  }
}
