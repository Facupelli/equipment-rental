import { randomUUID } from 'crypto';
import { DateRange } from '../value-objects/date-range.vo';
import { AssignmentSource, AssignmentType } from '@repo/types';
import { InvalidAssetAssignmentException } from '../exceptions/asset.exceptions';

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
    if (props.type === AssignmentType.ORDER) {
      if (!props.orderId) {
        throw new InvalidAssetAssignmentException('ORDER assignment requires orderId.');
      }
      if (!props.orderItemId) {
        throw new InvalidAssetAssignmentException('ORDER assignment requires orderItemId.');
      }
      if (!props.source) {
        throw new InvalidAssetAssignmentException('ORDER assignment requires source (OWNED or EXTERNAL).');
      }
    }

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
