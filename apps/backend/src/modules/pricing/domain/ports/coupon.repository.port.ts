import { Coupon } from '../entities/coupon.entity';

export type PrismaTransactionClient = any;

export abstract class CouponRepositoryPort {
  abstract load(id: string): Promise<Coupon | null>;
  abstract loadByCode(tenantId: string, code: string): Promise<Coupon | null>;
  abstract save(coupon: Coupon, tx?: PrismaTransactionClient): Promise<string>;
}
