import { Injectable } from "@nestjs/common";
// biome-ignore lint: useImportType
import { QueryBus } from "@nestjs/cqrs";
import { CalculateQuoteQuery } from "./application/queries/calculate-quote/calculate-quote.query";
import type { Quote } from "./domain/value-objects/quote";

interface CalculateQuoteInput {
	equipmentTypeId: string;
	startDate: Date;
	endDate: Date;
	quantity: number;
	customerId?: string;
	promoCode?: string;
}

@Injectable()
export class PricingFacade {
	constructor(private readonly queryBus: QueryBus) {}

	async calculateQuote(input: CalculateQuoteInput): Promise<Quote> {
		const query = new CalculateQuoteQuery(
			input.equipmentTypeId,
			input.startDate,
			input.endDate,
			input.quantity,
			input.customerId,
			input.promoCode,
		);

		const quote = await this.queryBus.execute<CalculateQuoteQuery, Quote>(
			query,
		);

		return quote;
	}
}
