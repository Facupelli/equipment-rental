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
  isPublished: boolean;
  isRetired: boolean;
}

export class Bundle {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly billingUnitId: string,
    public readonly name: string,
    private description: string | null,
    private readonly components: BundleComponent[],
    private published: boolean,
    private retired: boolean,
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
      false, // starts as draft
      false,
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
      props.isPublished,
      props.isRetired,
    );
  }

  // --- Queries ---

  get currentDescription(): string | null {
    return this.description;
  }

  isPublished(): boolean {
    return this.published;
  }

  isRetired(): boolean {
    return this.retired;
  }

  isAvailableForBooking(): boolean {
    return this.published && !this.retired;
  }

  getComponents(): BundleComponent[] {
    return [...this.components];
  }

  // --- Commands ---

  publish(): void {
    if (this.retired) throw new BundleAlreadyRetiredException();
    if (this.published) throw new BundleAlreadyPublishedException();
    this.published = true;
  }

  retire(): void {
    if (this.retired) throw new BundleAlreadyRetiredException();
    this.retired = true;
  }

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }

  addComponent(productTypeId: string, quantity: number): void {
    if (this.retired) throw new BundleAlreadyRetiredException();
    const duplicate = this.components.some((c) => c.productTypeId === productTypeId);
    if (duplicate) throw new DuplicateBundleComponentException(productTypeId);
    this.components.push(BundleComponent.create({ productTypeId, quantity }));
  }

  removeComponent(productTypeId: string): void {
    if (this.retired) throw new BundleAlreadyRetiredException();
    const idx = this.components.findIndex((c) => c.productTypeId === productTypeId);
    if (idx === -1) throw new BundleComponentNotFoundException(productTypeId);
    this.components.splice(idx, 1);
  }
}
