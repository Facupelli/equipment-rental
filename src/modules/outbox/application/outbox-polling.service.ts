import { Injectable, Logger } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { EventBus } from "@nestjs/cqrs";
import { Cron, CronExpression } from "@nestjs/schedule";
// biome-ignore lint: /style/useImportType
import { DataSource, IsNull } from "typeorm";
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
		const queryRunner = this.dataSource.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		const events = await queryRunner.manager.find(OutboxEventEntity, {
			where: { published_at: IsNull() },
			order: { created_at: "ASC" },
		});

		if (events.length === 0) {
			await queryRunner.release();
			return;
		}

		this.logger.log(`Processing ${events.length} outbox events...`);

		for (const event of events) {
			try {
				const outboxEvent = new OutboxEvent(
					event.event_type,
					event.payload,
					event.aggregate_id,
					event.created_at,
				);

				this.eventBus.publish(outboxEvent);

				await queryRunner.manager.update(
					OutboxEventEntity,
					{ id: event.id },
					{ published_at: new Date() },
				);
			} catch (err) {
				this.logger.error(`Failed to process event ${event.id}`, err);
			}
		}

		await queryRunner.commitTransaction();
	}
}
