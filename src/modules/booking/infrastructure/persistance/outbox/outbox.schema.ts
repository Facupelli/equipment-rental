import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Outbox Pattern Schema
 *
 * This is the "seed" for async evolution!
 *
 * Instead of:
 * 1. Save reservation
 * 2. Immediately call other services
 *
 * We do:
 * 1. Save reservation + outbox message (single transaction)
 * 2. Background worker processes outbox
 * 3. Eventually: Replace with Kafka/RabbitMQ
 *
 * Benefits:
 * - Transactional consistency (both or nothing)
 * - No need for distributed transactions
 * - Easy to evolve to message queue later
 */
@Entity({ schema: "booking", name: "outbox" })
@Index(["status", "created_at"])
export class OutboxSchema {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 100 })
  event_type: string; // 'ReservationCreated', 'ReservationConfirmed', etc.

  @Column("jsonb")
  payload: any; // Event data

  @Column("varchar", { length: 20, default: "pending" })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  @Column("int", { default: 0 })
  retry_count: number;

  @Column("text", { nullable: true })
  error_message?: string;

  @CreateDateColumn()
  created_at: Date;

  @Column("timestamp", { nullable: true })
  processed_at?: Date;
}
