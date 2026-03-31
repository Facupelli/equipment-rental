export const formatCurrency = (
  amount: number,
  currency: string,
  locale: string,
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Graceful degradation: show raw number + currency code
    return `${currency} ${amount.toFixed(2)}`;
  }
};
