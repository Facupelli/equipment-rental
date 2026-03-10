export function formatOrderNumber(orderNumber: number): string {
  return `ORD-${String(orderNumber).padStart(5, "0")}`;
}
