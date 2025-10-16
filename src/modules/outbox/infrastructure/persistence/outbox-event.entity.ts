import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ schema: "outbox", name: "outbox_events" })
export class OutboxEventEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	event_type: string;

	@Column({ nullable: true })
	aggregate_id?: string;

	@Column({ type: "jsonb" })
	payload: Record<string, any>;

	@CreateDateColumn()
	created_at: Date;

	@Column({ type: "timestamp", nullable: true })
	published_at?: Date;
}
