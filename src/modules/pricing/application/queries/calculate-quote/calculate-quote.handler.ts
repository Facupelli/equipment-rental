import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { DiscountRule } from "src/modules/pricing/domain/models/discount-rule";
import type { RateStructure } from "src/modules/pricing/domain/models/rate-structure.model";
// biome-ignore lint: /style/useImportType
import { DiscountApplicationService } from "src/modules/pricing/domain/services/discount-application.service";
// biome-ignore lint: /style/useImportType
import { RateCalculationService } from "src/modules/pricing/domain/services/rate-calculation.service";
import type { Money } from "src/modules/pricing/domain/value-objects/money";
import { Quote } from "src/modules/pricing/domain/value-objects/quote";
import { RentalDuration } from "src/modules/pricing/domain/value-objects/rental-duration";
// biome-ignore lint: /style/useImportType
import { DiscountRuleRepository } from "src/modules/pricing/infrastructure/persistence/typeorm/discount-rule.repository";
// biome-ignore lint: /style/useImportType
import { RateStructureRepository } from "src/modules/pricing/infrastructure/persistence/typeorm/rate-structure.repository";
import { CalculateQuoteQuery } from "./calculate-quote.query";

@Injectable()
@QueryHandler(CalculateQuoteQuery)
export class CalculateQuoteHandler
	implements IQueryHandler<CalculateQuoteQuery>
{
	constructor(
		private readonly rateStructureRepo: RateStructureRepository,
		private readonly discountRuleRepo: DiscountRuleRepository,
		private readonly rateCalculationService: RateCalculationService,
		private readonly discountApplicationService: DiscountApplicationService,
	) {}

	async execute(query: CalculateQuoteQuery): Promise<Quote> {
		this.validateInput(query);

		// This encapsulates the "how long is this rental?" logic
		// including rounding rules (e.g., partial hours round up)
		const duration = RentalDuration.between(query.startDate, query.endDate);

		// We need the rate valid at the rental start date
		// (not "now" - rates might change between quote and rental)
		const rateStructure = await this.rateStructureRepo.findActiveRateForDate(
			query.equipmentTypeId,
			query.startDate,
		);

		if (!rateStructure) {
			throw new NotFoundException(
				`No active rate structure found for equipment type ${query.equipmentTypeId} at ${query.startDate.toISOString()}`,
			);
		}

		// Delegate to domain service: "Given rates and duration, what's the subtotal?"
		// This service implements: min(hourly × hours, daily × days), respects minimum charge
		const subtotal = this.rateCalculationService.calculateSubtotal(
			rateStructure,
			duration,
		);

		// Simple approach: fetch all active rules, filter in-memory
		// (We chose Option 1 from the architectural discussion)
		const allDiscountRules = await this.discountRuleRepo.findAllActive(
			query.startDate,
		);

		// Filter rules based on query context (promo code, customer, etc.)
		const applicableRules = this.filterApplicableRules(allDiscountRules, query);

		// Delegate to domain service: complex precedence/stacking logic
		const discountLines = this.discountApplicationService.applyDiscounts(
			applicableRules,
			subtotal,
		);

		// The Quote factory handles: summing discounts, calculating tax, computing total
		const quote = Quote.create({
			equipmentTypeId: query.equipmentTypeId,
			startDate: query.startDate,
			endDate: query.endDate,
			duration,
			baseRate: this.determineAppliedRate(rateStructure, duration),
			subtotal,
			discountsApplied: discountLines,
			taxPercentage: rateStructure.taxPercentage,
			quantity: query.quantity,
		});

		return quote;
	}

	private validateInput(query: CalculateQuoteQuery): void {
		if (!query.startDate || !query.endDate) {
			throw new BadRequestException("Start date and end date are required");
		}

		if (query.startDate >= query.endDate) {
			throw new BadRequestException("Start date must be before end date");
		}

		if (!query.equipmentTypeId || query.equipmentTypeId.trim().length === 0) {
			throw new BadRequestException("Equipment type ID is required");
		}
	}

	private filterApplicableRules(
		allRules: DiscountRule[],
		query: CalculateQuoteQuery,
	): DiscountRule[] {
		return allRules.filter((rule) => {
			// Check if promo code matches (if provided)
			if (query.promoCode) {
				const criteria = rule.eligibilityCriteria as any;
				if (criteria.promoCode === query.promoCode) {
					return true;
				}
			}

			// Check if loyalty tier matches (if customer provided)
			// Note: We skip actual CRM lookup per Decision D
			// Future: const loyaltyStatus = await crmFacade.getCustomerLoyaltyStatus(query.customerId)
			if (query.customerId) {
				const criteria = rule.eligibilityCriteria as any;
				// Placeholder: in real implementation, we'd fetch customer's tier
				// For now, this will match zero rules (no customer tier data available)
				if (criteria.loyaltyTier) {
					return false; // Can't validate without CRM integration
				}
			}

			// Check for always-applicable rules (e.g., seasonal, volume)
			// Future: implement volume-based rules (e.g., "7+ day rentals get 10% off")
			const criteria = rule.eligibilityCriteria as any;
			if (criteria.minRentalDays) {
				const duration = RentalDuration.between(query.startDate, query.endDate);
				const rentalDays = Math.ceil(duration.totalHours / 24);
				return rentalDays >= criteria.minRentalDays;
			}

			// Default: rule doesn't apply
			return false;
		});
	}

	private determineAppliedRate(
		rateStructure: RateStructure,
		duration: RentalDuration,
	): Money {
		// Return the rate we actually used for calculation
		// (For display: "Charged at $50/day" vs "$10/hour")
		if (duration.isMultiDay()) {
			return rateStructure.dailyRate;
		}
		return rateStructure.hourlyRate;
	}
}
