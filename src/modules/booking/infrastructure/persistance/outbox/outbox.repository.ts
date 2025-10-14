import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OutboxSchema } from "./outbox.schema";

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxSchema)
    private readonly repository: Repository<OutboxSchema>
  ) {}

  /**
   * Add event to outbox (called within same transaction as domain operation)
   */
  async save(eventType: string, payload: any): Promise<void> {
    const outboxMessage = this.repository.create({
      event_type: eventType,
      payload,
      status: "pending",
    });

    await this.repository.save(outboxMessage);
  }

  /**
   * Get pending events to process
   */
  async getPendingEvents(limit = 100): Promise<OutboxSchema[]> {
    return this.repository.find({
      where: { status: "pending" },
      order: { created_at: "ASC" },
      take: limit,
    });
  }

  /**
   * Mark event as completed
   */
  async markCompleted(id: string): Promise<void> {
    await this.repository.update(id, {
      status: "completed",
      processed_at: new Date(),
    });
  }

  /**
   * Mark event as failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    await this.repository.update(id, {
      status: "failed",
      retry_count: () => "retry_count + 1",
      error_message: error,
    });
  }
}
