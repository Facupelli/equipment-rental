import { randomUUID } from 'crypto';
import { InvalidOwnerNameException } from '../expcetions/owner.exceptions';

export interface CreateOwnerProps {
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export interface ReconstituteOwnerProps {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export class Owner {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly notes: string | null,
    private isActive: boolean,
  ) {}

  static create(props: CreateOwnerProps): Owner {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidOwnerNameException();
    }
    return new Owner(
      randomUUID(),
      props.tenantId,
      props.name.trim(),
      props.email?.trim() ?? null,
      props.phone?.trim() ?? null,
      props.notes?.trim() ?? null,
      true,
    );
  }

  static reconstitute(props: ReconstituteOwnerProps): Owner {
    return new Owner(props.id, props.tenantId, props.name, props.email, props.phone, props.notes, props.isActive);
  }

  get active(): boolean {
    return this.isActive;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
