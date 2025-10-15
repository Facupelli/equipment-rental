export class ReservationOrderItem {
  id: string;
  orderId: string;
  itemId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ReservationOrderItem>) {
    Object.assign(this, partial);
  }

  hasValidQuantity(): boolean {
    return this.quantity > 0;
  }

  increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error("Quantity increase must be positive");
    }
    this.quantity += amount;
  }

  decreaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error("Quantity decrease must be positive");
    }
    if (this.quantity - amount < 1) {
      throw new Error("Quantity cannot be less than 1");
    }
    this.quantity -= amount;
  }

  setQuantity(newQuantity: number): void {
    if (newQuantity < 1) {
      throw new Error("Quantity must be at least 1");
    }
    this.quantity = newQuantity;
  }
}
