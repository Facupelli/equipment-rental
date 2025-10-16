import { Injectable, Logger } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { EventBus } from "@nestjs/cqrs";
import { Cron, CronExpression } from "@nestjs/schedule";
// biome-ignore lint: /style/useImportType
import { DataSource } from "typeorm";
import { OutboxEvent } from "../domain/models/outbox-event.model";
import { OutboxEventEntity } from "../infrastructure/persistence/outbox-event.entity";

@Injectable()
export class OutboxPollingService {
	private readonly logger = new Logger(OutboxPollingService.name);

	constructor(
		private readonly dataSource: DataSource,
		private readonly eventBus: EventBus,
	) {}

	@Cron(CronExpression.EVERY_5_SECONDS)
	async processOutbox(): Promise<void> {
		const manager = this.dataSource.manager;

		const events = await manager.find(OutboxEventEntity, {
			where: { publishedAt: null },
			order: { createdAt: "ASC" },
		});

		if (events.length === 0) return;

		this.logger.log(`Processing ${events.length} outbox events...`);

		for (const event of events) {
			try {
				const outboxEvent = new OutboxEvent(
					event.eventType,
					event.payload,
					event.aggregateId,
					event.createdAt,
				);

				this.eventBus.publish(outboxEvent);

				await manager.update(
					OutboxEventEntity,
					{ id: event.id },
					{ publishedAt: new Date() },
				);
			} catch (err) {
				this.logger.error(`Failed to process event ${event.id}`, err);
			}
		}
	}
}
