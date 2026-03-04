import { randomUUID } from 'crypto';
import { InvalidBundleComponentQuantityException } from '../exceptions/bundle.exceptions';

export interface CreateBundleComponentProps {
  productTypeId: string;
  quantity: number;
}

export interface ReconstituteBundleComponentProps {
  id: string;
  bundleId: string;
  productTypeId: string;
  quantity: number;
}

export class BundleComponent {
  private constructor(
    public readonly id: string,
    public readonly bundleId: string | null,
    public readonly productTypeId: string,
    public readonly quantity: number,
  ) {}

  static create(props: CreateBundleComponentProps): BundleComponent {
    if (props.quantity <= 0) {
      throw new InvalidBundleComponentQuantityException();
    }
    return new BundleComponent(randomUUID(), null, props.productTypeId, props.quantity);
  }

  static reconstitute(props: ReconstituteBundleComponentProps): BundleComponent {
    return new BundleComponent(props.id, props.bundleId, props.productTypeId, props.quantity);
  }
}
