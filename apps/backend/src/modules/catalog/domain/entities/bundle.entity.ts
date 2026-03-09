import { randomUUID } from 'crypto';
import { BundleComponent } from './bundle-component.entity';
import {
  InvalidBundleNameException,
  DuplicateBundleComponentException,
  BundleComponentNotFoundException,
  BundleAlreadyRetiredException,
  BundleAlreadyPublishedException,
} from '../exceptions/bundle.exceptions';

export interface CreateBundleProps {
  tenantId: string;
  billingUnitId: string;
  name: string;
  description: string | null;
}

export interface ReconstituteBundleProps {
  id: string;
  tenantId: string;
  billingUnitId: string;
  name: string;
  description: string | null;
  components: BundleComponent[];
  publishedAt: Date | null;
  retiredAt: Date | null;
}

export class Bundle {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly billingUnitId: string,
    public readonly name: string,
    private description: string | null,
    private readonly components: BundleComponent[],
    private publishedAt: Date | null,
    private retiredAt: Date | null,
  ) {}

  // --- Factories ---

  static create(props: CreateBundleProps): Bundle {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidBundleNameException();
    }
    return new Bundle(
      randomUUID(),
      props.tenantId,
      props.billingUnitId,
      props.name.trim(),
      props.description?.trim() ?? null,
      [],
      null,
      null,
    );
  }

  static reconstitute(props: ReconstituteBundleProps): Bundle {
    return new Bundle(
      props.id,
      props.tenantId,
      props.billingUnitId,
      props.name,
      props.description,
      props.components,
      props.publishedAt,
      props.retiredAt,
    );
  }

  // --- Queries ---

  get currentDescription(): string | null {
    return this.description;
  }

  getPublishedAt(): Date | null {
    return this.publishedAt;
  }

  getRetiredAt(): Date | null {
    return this.retiredAt;
  }

  isPublished(): boolean {
    return this.publishedAt !== null;
  }

  isRetired(): boolean {
    return this.retiredAt !== null;
  }

  isAvailableForBooking(): boolean {
    return this.isPublished() && !this.isRetired();
  }

  getComponents(): BundleComponent[] {
    return [...this.components];
  }

  // --- Commands ---

  publish(): void {
    if (this.isRetired()) {
      throw new BundleAlreadyRetiredException();
    }
    if (this.isPublished()) {
      throw new BundleAlreadyPublishedException();
    }
    this.publishedAt = new Date();
  }

  retire(): void {
    if (this.isRetired()) {
      throw new BundleAlreadyRetiredException();
    }
    this.retiredAt = new Date();
  }

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }

  addComponent(productTypeId: string, quantity: number): void {
    if (this.isRetired()) {
      throw new BundleAlreadyRetiredException();
    }
    const duplicate = this.components.some((c) => c.productTypeId === productTypeId);
    if (duplicate) {
      throw new DuplicateBundleComponentException(productTypeId);
    }
    this.components.push(BundleComponent.create({ productTypeId, quantity }));
  }

  removeComponent(productTypeId: string): void {
    if (this.isRetired()) {
      throw new BundleAlreadyRetiredException();
    }
    const idx = this.components.findIndex((c) => c.productTypeId === productTypeId);
    if (idx === -1) {
      throw new BundleComponentNotFoundException(productTypeId);
    }
    this.components.splice(idx, 1);
  }
}
