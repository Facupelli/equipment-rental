import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "src/shared/infrastructure/database/transaction-context";
// biome-ignore lint: /style/useImportType
import { DataSource, type Repository } from "typeorm";
import { OutboxEventEntity } from "../infrastructure/persistence/outbox-event.entity";

@Injectable()
export class OutboxService {
	private readonly repository: Repository<OutboxEventEntity>;

	constructor(
		private readonly dataSource: DataSource,
		private readonly txContext: TransactionContext,
	) {
		this.repository = this.dataSource.getRepository(OutboxEventEntity);
	}

	async saveEvent(
		eventType: string,
		payload: any,
		aggregateId?: string,
	): Promise<void> {
		const manager =
			this.txContext.getEntityManager() ?? this.dataSource.manager;
		const repo = manager.getRepository(OutboxEventEntity);

		const event = repo.create({
			event_type: eventType,
			payload,
			aggregate_id: aggregateId,
		});

		await repo.save(event);
	}
}
