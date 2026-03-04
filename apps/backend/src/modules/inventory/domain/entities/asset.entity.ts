import { randomUUID } from 'crypto';
import { AssetAssignment } from './asset-assignment.entity';
import { AssetAssignmentNotFoundException } from '../exceptions/asset.exceptions';

export interface CreateAssetProps {
  locationId: string;
  productTypeId: string;
  ownerId: string | null;
  serialNumber: string | null;
  notes: string | null;
}

export interface ReconstituteAssetProps {
  id: string;
  locationId: string;
  productTypeId: string;
  ownerId: string | null;
  serialNumber: string | null;
  notes: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  assignments: AssetAssignment[];
}

export class Asset {
  private constructor(
    public readonly id: string,
    public readonly locationId: string,
    public readonly productTypeId: string,
    public readonly ownerId: string | null,
    public readonly serialNumber: string | null,
    public readonly notes: string | null,
    private isActive: boolean,
    private deletedAt: Date | null,
    private readonly assignments: AssetAssignment[],
  ) {}

  static create(props: CreateAssetProps): Asset {
    return new Asset(
      randomUUID(),
      props.locationId,
      props.productTypeId,
      props.ownerId ?? null,
      props.serialNumber ?? null,
      props.notes ?? null,
      true,
      null,
      [],
    );
  }

  static reconstitute(props: ReconstituteAssetProps): Asset {
    return new Asset(
      props.id,
      props.locationId,
      props.productTypeId,
      props.ownerId,
      props.serialNumber,
      props.notes,
      props.isActive,
      props.deletedAt,
      props.assignments,
    );
  }

  get active(): boolean {
    return this.isActive;
  }

  get deleted(): boolean {
    return this.deletedAt !== null;
  }

  get deletedOn(): Date | null {
    return this.deletedAt;
  }

  getAssignments(): AssetAssignment[] {
    return [...this.assignments];
  }

  deactivate(): void {
    this.isActive = false;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.isActive = false;
  }

  addAssignment(assignment: AssetAssignment): void {
    this.assignments.push(assignment);
  }

  removeAssignment(assignmentId: string): void {
    const idx = this.assignments.findIndex((a) => a.id === assignmentId);
    if (idx === -1) {
      throw new AssetAssignmentNotFoundException(assignmentId);
    }
    this.assignments.splice(idx, 1);
  }
}
