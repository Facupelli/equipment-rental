import Decimal from 'decimal.js';

import {
  BundleBookingEligibilityDto,
  BundleInactiveForBookingError,
  BundleNotBookableAtLocationError,
  ProductTypeInactiveForBookingError,
  ProductTypeNotBookableAtLocationError,
} from 'src/modules/catalog/catalog.public-api';
import { CouponNotFoundError, CouponValidationError, PricingPublicApi } from 'src/modules/pricing/pricing.public-api';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import {
  InvalidBookingLocationError,
  BundleNotFoundError,
  ConflictGroup,
  InvalidPickupSlotError,
  InvalidReturnSlotError,
  NoActiveContractForAssetError,
  OrderMustContainItemsError,
  OrderItemUnavailableError,
  ProductTypeNotFoundError,
  UnavailableItem,
} from '../../../domain/errors/order.errors';

export type ResolvedProductItem = {
  type: 'PRODUCT';
  productTypeId: string;
  quantity: number;
  assetId?: string;
  locationId: string;
  period: DateRange;
  currency: string;
  price: Awaited<ReturnType<typeof PricingPublicApi.prototype.calculateProductPrice>>;
};

export type ResolvedBundleItem = {
  type: 'BUNDLE';
  bundleId: string;
  bundle: BundleBookingEligibilityDto;
  locationId: string;
  period: DateRange;
  currency: string;
  price: Awaited<ReturnType<typeof PricingPublicApi.prototype.calculateBundlePrice>>;
  componentStandalonePrices: Map<string, Decimal>;
};

export type ResolvedItem = ResolvedProductItem | ResolvedBundleItem;

export type DemandUnit = {
  productTypeId: string;
  locationId: string;
  period: DateRange;
  pinnedAssetId?: string;
  provenance: { type: 'PRODUCT'; productTypeId: string } | { type: 'BUNDLE'; bundleId: string };
  resolvedAssetId?: string;
};

export type CreateOrderError =
  | OrderMustContainItemsError
  | OrderItemUnavailableError
  | InvalidPickupSlotError
  | InvalidReturnSlotError
  | NoActiveContractForAssetError
  | InvalidBookingLocationError
  | ProductTypeNotFoundError
  | BundleNotFoundError
  | ProductTypeInactiveForBookingError
  | BundleInactiveForBookingError
  | ProductTypeNotBookableAtLocationError
  | BundleNotBookableAtLocationError
  | CouponNotFoundError
  | CouponValidationError;

export type ResolveDemandResult = {
  unavailableItems: UnavailableItem[];
  conflictGroups: ConflictGroup[];
};
