import dayjs from "@/lib/dates/dayjs";
import { formatCurrency } from "@/shared/utils/price.utils";
import type { CartDiscountLineItem, CartPriceLineItem } from "@repo/schemas";

export const formatSlot = (minutes: number): string =>
  dayjs().startOf("day").add(minutes, "minute").format("h:mm A");

/**
 * Formats a single discount for display in the cart.
 *
 * PERCENTAGE → "−10%"
 * FLAT       → "−$500"
 *
 * The minus sign uses the proper unicode minus (U+2212) rather than a hyphen,
 * which renders more crisply at small sizes next to currency symbols.
 */
export function formatDiscount(discount: CartDiscountLineItem): string {
  if (discount.type === "PERCENTAGE") {
    return `\u2212${discount.value}%`;
  }
  return `\u2212${formatCurrency(discount.discountAmount)}`;
}

/**
 * Reconstructs the pre-discount subtotal for a single line item.
 *
 * The backend returns `subtotal` (post-discount) and each discount's
 * `discountAmount`. We sum the discounts back on top to get the original price,
 * which is used to render the strikethrough price next to the discounted one.
 */
export function computeOriginalSubtotal(item: CartPriceLineItem): number {
  const totalDiscount = item.discounts.reduce(
    (acc, d) => acc + d.discountAmount,
    0,
  );
  return item.subtotal + totalDiscount;
}
