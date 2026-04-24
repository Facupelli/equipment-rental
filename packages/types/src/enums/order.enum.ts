export enum OrderStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum OrderItemType {
  PRODUCT = "PRODUCT",
  BUNDLE = "BUNDLE",
}

export enum FulfillmentMethod {
  PICKUP = "PICKUP",
  DELIVERY = "DELIVERY",
}
