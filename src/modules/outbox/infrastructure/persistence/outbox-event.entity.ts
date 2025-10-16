import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

@Entity("outbox")
export class OutboxEventEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	eventType: string;

	@Column({ nullable: true })
	aggregateId?: string;

	@Column({ type: "jsonb" })
	payload: Record<string, any>;

	@CreateDateColumn()
	createdAt: Date;

	@Column({ type: "timestamp", nullable: true })
	publishedAt?: Date;
}
