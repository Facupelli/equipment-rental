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
			return "Cupón activo";
		case "CUSTOMER_SPECIFIC":
			return "Cliente específico";
		case "DURATION": {
			const tiers = condition.tiers;
			return tiers
				.map((t) => {
					const range =
						t.toDays !== null
							? `${t.fromDays}–${t.toDays} días`
							: `${t.fromDays}+ días`;
					return `${range}: -${t.discountPct}%`;
				})
				.join(" · ");
		}
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
