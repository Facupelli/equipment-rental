import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { DataSource, EntityManager } from "typeorm";
import { OutboxEventEntity } from "../infrastructure/persistence/outbox-event.entity";

@Injectable()
export class OutboxService {
	constructor(private readonly dataSource: DataSource) {}

	async publishEvent(
		eventType: string,
		payload: any,
		manager?: EntityManager,
		aggregateId?: string,
	): Promise<void> {
		const repository = (manager ?? this.dataSource.manager).getRepository(
			OutboxEventEntity,
		);

		const event = repository.create({
			eventType,
			payload,
			aggregateId,
		});

		await repository.save(event);
	}
}
