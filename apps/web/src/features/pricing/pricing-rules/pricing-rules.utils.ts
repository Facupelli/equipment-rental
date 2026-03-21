import type { PricingRuleCondition, PricingRuleEffect } from "@repo/schemas";

export function formatCondition(condition: PricingRuleCondition): string {
  switch (condition.type) {
    case "SEASONAL": {
      const from = new Date(condition.dateFrom).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
      const to = new Date(condition.dateTo).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
      return `${from} – ${to}`;
    }
    case "VOLUME":
      return `Si Alquiler > ${condition.threshold} días`;
    case "COUPON":
      return `Código: ${condition.code}`;
    case "CUSTOMER_SPECIFIC":
      return "Cliente específico";
    default:
      return "Desconocido";
  }
}

export function formatEffect(effect: PricingRuleEffect): string {
  switch (effect.type) {
    case "PERCENTAGE":
      return `-${effect.value}% Total`;
    case "FLAT":
      return `$${effect.value}/día`;
    default:
      return "Desconocido";
  }
}
