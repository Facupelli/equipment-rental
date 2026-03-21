import type { CouponView } from "@repo/schemas";

export interface CouponUsage {
  label: string;
  percentage: number | null;
}

export function formatCouponUsage(coupon: CouponView): CouponUsage {
  if (coupon.maxUses === null) {
    return {
      label: `${coupon.totalRedemptions} canjes`,
      percentage: null,
    };
  }

  const percentage = Math.round(
    (coupon.totalRedemptions / coupon.maxUses) * 100,
  );

  return {
    label: `${coupon.totalRedemptions}/${coupon.maxUses} canjes`,
    percentage,
  };
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-ES", DATE_FORMAT);
}

export function formatCouponValidity(coupon: CouponView): string {
  const { validFrom, validUntil } = coupon;

  if (!validFrom && !validUntil) return "Sin restricción";
  if (validFrom && !validUntil) return `Desde ${formatDate(validFrom)}`;
  if (!validFrom && validUntil) return `Hasta ${formatDate(validUntil)}`;

  return `${formatDate(validFrom!)} — ${formatDate(validUntil!)}`;
}
