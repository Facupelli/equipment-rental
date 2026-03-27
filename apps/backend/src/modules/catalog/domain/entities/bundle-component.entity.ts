import { randomUUID } from 'crypto';
import { Result, err, ok } from 'neverthrow';
import { InvalidBundleComponentQuantityError } from '../errors/catalog.errors';

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

  static create(props: CreateBundleComponentProps): Result<BundleComponent, InvalidBundleComponentQuantityError> {
    if (props.quantity <= 0) {
      return err(new InvalidBundleComponentQuantityError());
    }
    return ok(new BundleComponent(randomUUID(), null, props.productTypeId, props.quantity));
  }

  static reconstitute(props: ReconstituteBundleComponentProps): BundleComponent {
    return new BundleComponent(props.id, props.bundleId, props.productTypeId, props.quantity);
  }
}
