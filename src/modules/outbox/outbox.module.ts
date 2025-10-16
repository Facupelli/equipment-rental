import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxService } from "./application/outbox.service";
import { OutboxPollingService } from "./application/outbox-polling.service";
import { OutboxEventEntity } from "./infrastructure/persistence/outbox-event.entity";

@Module({
	imports: [
		CqrsModule,
		ScheduleModule.forRoot(),
		TypeOrmModule.forFeature([OutboxEventEntity]),
	],
	providers: [OutboxService, OutboxPollingService],
	exports: [OutboxService],
})
export class OutboxModule {}
