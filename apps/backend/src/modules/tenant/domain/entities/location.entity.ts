import { randomUUID } from 'crypto';
import { InvalidLocationNameException } from '../exceptions/location.exceptions';

export interface CreateLocationProps {
  tenantId: string;
  name: string;
  address?: string;
}

export interface ReconstituteLocationProps {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export class Location {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly address: string | null,
    private isActive: boolean,
  ) {}

  static create(props: CreateLocationProps): Location {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidLocationNameException();
    }
    return new Location(randomUUID(), props.tenantId, props.name.trim(), props.address?.trim() ?? null, true);
  }

  static reconstitute(props: ReconstituteLocationProps): Location {
    return new Location(props.id, props.tenantId, props.name, props.address, props.isActive);
  }

  get active(): boolean {
    return this.isActive;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
