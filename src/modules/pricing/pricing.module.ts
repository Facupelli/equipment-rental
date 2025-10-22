import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateRateStructureHandler } from "./application/commands/create-rate-structure.handler";
import { CalculateQuoteHandler } from "./application/queries/calculate-quote/calculate-quote.handler";
import { GetActiveRateStructureHandler } from "./application/queries/get-active-rate-structure/get-active-rate-structure.handler";
import { DiscountApplicationService } from "./domain/services/discount-application.service";
import { RateCalculationService } from "./domain/services/rate-calculation.service";
import { DiscountRuleEntity } from "./infrastructure/persistence/typeorm/discount-rule.entity";
import { DiscountRuleRepository } from "./infrastructure/persistence/typeorm/discount-rule.repository";
import { RateStructureEntity } from "./infrastructure/persistence/typeorm/rate-structure.entity";
import { RateStructureRepository } from "./infrastructure/persistence/typeorm/rate-structure.repository";
import { RateStructureController } from "./presentation/rate-structure.controller";
import { PricingFacade } from "./pricing.facade";

const CommandHandlers = [CreateRateStructureHandler];
const QueryHandlers = [GetActiveRateStructureHandler, CalculateQuoteHandler];
const EventHandlers = [];

@Module({
	imports: [
		CqrsModule,
		TypeOrmModule.forFeature([RateStructureEntity, DiscountRuleEntity]),
	],
	controllers: [RateStructureController],
	providers: [
		PricingFacade,
		// Application
		...CommandHandlers,
		...QueryHandlers,
		...EventHandlers,

		// Domain
		DiscountApplicationService,
		RateCalculationService,

		// Infrastructure
		RateStructureRepository,
		DiscountRuleRepository,
	],
	exports: [PricingFacade],
})
export class PricingModule {}
