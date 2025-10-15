import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReservationOrderItemSchema } from "./reservation-order-item.schema";
import { ReservationOrderItem } from "src/modules/booking/domain/entities/reservation-order-item.entity";
import { ReservationOrderItemMapper } from "./reservation.mappers";

@Injectable()
export class ReservationOrderItemRepository {
  constructor(
    @InjectRepository(ReservationOrderItemSchema)
    private readonly repository: Repository<ReservationOrderItemSchema>
  ) {}

  async save(reservationOrderItem: ReservationOrderItem): Promise<void> {
    const schema = ReservationOrderItemMapper.toSchema(reservationOrderItem);
    await this.repository.save(schema);
  }
}
