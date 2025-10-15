import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReservationOrderItemEntity } from "./reservation-order-item.entity";
import { ReservationOrderItem } from "src/modules/booking/domain/models/reservation-order-item.model";
import { ReservationOrderItemMapper } from "./reservation.mappers";

@Injectable()
export class ReservationOrderItemRepository {
  constructor(
    @InjectRepository(ReservationOrderItemEntity)
    private readonly repository: Repository<ReservationOrderItemEntity>
  ) {}

  async save(reservationOrderItem: ReservationOrderItem): Promise<void> {
    const schema = ReservationOrderItemMapper.toEntity(reservationOrderItem);
    await this.repository.save(schema);
  }
}
