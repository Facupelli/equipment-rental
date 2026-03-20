import type { ParsedOrderDetailResponseDto } from "@/features/orders/queries/get-order-by-id";

type CustomerSummary = NonNullable<ParsedOrderDetailResponseDto["customer"]>;

/**
 * Returns the primary display name for a customer.
 * For company customers, this is the company name.
 * For individual customers, this is their full name.
 */
export function getCustomerDisplayName(customer: CustomerSummary): string {
  if (customer.isCompany && customer.companyName) {
    return customer.companyName;
  }
  return `${customer.firstName} ${customer.lastName}`;
}

/**
 * Returns the contact person's full name for company customers.
 * Returns null for individual customers, as the display name already is their name.
 */
export function getCustomerContactName(
  customer: CustomerSummary,
): string | null {
  if (!customer.isCompany) return null;
  return `${customer.firstName} ${customer.lastName}`;
}

/**
 * Returns the two-letter uppercased initials derived from first and last name.
 * Used for avatar placeholders.
 */
export function getCustomerInitials(customer: CustomerSummary): string {
  const first = customer.firstName[0] ?? "";
  const last = customer.lastName[0] ?? "";
  return `${first}${last}`.toUpperCase();
}
