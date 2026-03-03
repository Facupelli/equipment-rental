import { randomUUID } from 'crypto';
import { DateRange } from '../value-objects/date-range.vo';
import { AssignmentSource, AssignmentType } from '@repo/types';

export interface CreateAssetAssignmentProps {
  assetId: string;
  period: DateRange;
  type: AssignmentType;
  source?: AssignmentSource;
  orderItemId?: string;
  orderId?: string;
  reason?: string;
}

export interface ReconstituteAssetAssignmentProps {
  id: string;
  assetId: string;
  period: DateRange;
  type: AssignmentType;
  source: AssignmentSource | null;
  orderItemId: string | null;
  orderId: string | null;
  reason: string | null;
}

export class AssetAssignment {
  private constructor(
    public readonly id: string,
    public readonly assetId: string,
    public readonly period: DateRange,
    public readonly type: AssignmentType,
    public readonly source: AssignmentSource | null,
    public readonly orderItemId: string | null,
    public readonly orderId: string | null,
    public readonly reason: string | null,
  ) {}

  static create(props: CreateAssetAssignmentProps): AssetAssignment {
    return new AssetAssignment(
      randomUUID(),
      props.assetId,
      props.period,
      props.type,
      props.source ?? null,
      props.orderItemId ?? null,
      props.orderId ?? null,
      props.reason ?? null,
    );
  }

  static reconstitute(props: ReconstituteAssetAssignmentProps): AssetAssignment {
    return new AssetAssignment(
      props.id,
      props.assetId,
      props.period,
      props.type,
      props.source,
      props.orderItemId,
      props.orderId,
      props.reason,
    );
  }

  isOrderAssignment(): boolean {
    return this.type === AssignmentType.ORDER;
  }

  isInternalBlock(): boolean {
    return this.type === AssignmentType.BLACKOUT || this.type === AssignmentType.MAINTENANCE;
  }
}
