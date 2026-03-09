import { randomUUID } from 'crypto';
import { BundleComponent } from './bundle-component.entity';
import {
  InvalidBundleNameException,
  DuplicateBundleComponentException,
  BundleComponentNotFoundException,
} from '../exceptions/bundle.exceptions';

export interface CreateBundleProps {
  tenantId: string;
  billingUnitId: string;
  name: string;
  isActive: boolean;
}

export interface ReconstituteBundleProps {
  id: string;
  tenantId: string;
  billingUnitId: string;
  name: string;
  isActive: boolean;
  components: BundleComponent[];
}

export class Bundle {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly billingUnitId: string,
    public readonly name: string,
    private isActive: boolean,
    private readonly components: BundleComponent[],
  ) {}

  static create(props: CreateBundleProps): Bundle {
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidBundleNameException();
    }
    return new Bundle(randomUUID(), props.tenantId, props.billingUnitId, props.name.trim(), props.isActive, []);
  }

  static reconstitute(props: ReconstituteBundleProps): Bundle {
    return new Bundle(props.id, props.tenantId, props.billingUnitId, props.name, props.isActive, props.components);
  }

  get active(): boolean {
    return this.isActive;
  }

  getComponents(): BundleComponent[] {
    return [...this.components];
  }

  deactivate(): void {
    this.isActive = false;
  }

  addComponent(productTypeId: string, quantity: number): void {
    const duplicate = this.components.some((c) => c.productTypeId === productTypeId);
    if (duplicate) {
      throw new DuplicateBundleComponentException(productTypeId);
    }
    const component = BundleComponent.create({ productTypeId, quantity });
    this.components.push(component);
  }

  removeComponent(productTypeId: string): void {
    const idx = this.components.findIndex((c) => c.productTypeId === productTypeId);
    if (idx === -1) {
      throw new BundleComponentNotFoundException(productTypeId);
    }
    this.components.splice(idx, 1);
  }
}
