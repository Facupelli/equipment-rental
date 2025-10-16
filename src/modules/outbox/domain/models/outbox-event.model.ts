import type { IEvent } from "@nestjs/cqrs";

export class OutboxEvent implements IEvent {
	constructor(
		public readonly eventType: string,
		public readonly payload: any,
		public readonly aggregateId?: string,
		public readonly createdAt?: Date,
	) {}
}
