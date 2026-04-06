import { randomUUID } from 'crypto';
import { BundleComponent } from './bundle-component.entity';
import { Result, err, ok } from 'neverthrow';
import {
  BundleAlreadyPublishedError,
  BundleAlreadyRetiredError,
  BundleCannotBePublishedWithoutPricingTiersError,
  BundleComponentNotFoundError,
  DuplicateBundleComponentError,
  InvalidBundleComponentQuantityError,
  InvalidBundleNameError,
} from '../errors/catalog.errors';

export interface CreateBundleProps {
  tenantId: string;
  billingUnitId: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
}

export interface ReconstituteBundleProps {
  id: string;
  tenantId: string;
  billingUnitId: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  components: BundleComponent[];
  hasPricingTiersConfigured: boolean;
  publishedAt: Date | null;
  retiredAt: Date | null;
}

export class Bundle {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private billingUnitId: string,
    private name: string,
    private imageUrl: string | null,
    private description: string | null,
    private readonly components: BundleComponent[],
    private hasPricingTiersConfigured: boolean,
    private publishedAt: Date | null,
    private retiredAt: Date | null,
  ) {}

  // --- Factories ---

  static create(props: CreateBundleProps): Result<Bundle, InvalidBundleNameError> {
    if (!props.name || props.name.trim().length === 0) {
      return err(new InvalidBundleNameError());
    }
    return ok(
      new Bundle(
        randomUUID(),
        props.tenantId,
        props.billingUnitId,
        props.name.trim(),
        props.imageUrl,
        props.description?.trim() ?? null,
        [],
        false,
        null,
        null,
      ),
    );
  }

  static reconstitute(props: ReconstituteBundleProps): Bundle {
    return new Bundle(
      props.id,
      props.tenantId,
      props.billingUnitId,
      props.name,
      props.imageUrl,
      props.description,
      props.components,
      props.hasPricingTiersConfigured,
      props.publishedAt,
      props.retiredAt,
    );
  }

  // --- Queries ---

  get currentDescription(): string | null {
    return this.description;
  }

  get currentBillingUnitId(): string {
    return this.billingUnitId;
  }

  get currentName(): string {
    return this.name;
  }

  get currentImageUrl(): string | null {
    return this.imageUrl;
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

  publish(): Result<
    void,
    BundleAlreadyRetiredError | BundleAlreadyPublishedError | BundleCannotBePublishedWithoutPricingTiersError
  > {
    if (this.isRetired()) {
      return err(new BundleAlreadyRetiredError());
    }
    if (this.isPublished()) {
      return err(new BundleAlreadyPublishedError());
    }
    if (!this.hasPricingTiersConfigured) {
      return err(new BundleCannotBePublishedWithoutPricingTiersError(this.id));
    }
    this.publishedAt = new Date();
    return ok(undefined);
  }

  retire(): Result<void, BundleAlreadyRetiredError> {
    if (this.isRetired()) {
      return err(new BundleAlreadyRetiredError());
    }
    this.retiredAt = new Date();
    return ok(undefined);
  }

  updateDescription(description: string | null): void {
    this.description = description?.trim() ?? null;
  }

  update(props: Partial<CreateBundleProps>): Result<void, InvalidBundleNameError | BundleAlreadyRetiredError> {
    if (this.isRetired()) {
      return err(new BundleAlreadyRetiredError());
    }

    if (props.name !== undefined) {
      if (props.name.trim().length === 0) {
        return err(new InvalidBundleNameError());
      }

      this.name = props.name.trim();
    }

    if (props.billingUnitId !== undefined) {
      this.billingUnitId = props.billingUnitId;
    }

    if (props.imageUrl !== undefined) {
      this.imageUrl = props.imageUrl;
    }

    if (props.description !== undefined) {
      this.description = props.description?.trim() ?? null;
    }

    return ok(undefined);
  }

  addComponent(
    productTypeId: string,
    quantity: number,
  ): Result<void, BundleAlreadyRetiredError | DuplicateBundleComponentError | InvalidBundleComponentQuantityError> {
    if (this.isRetired()) {
      return err(new BundleAlreadyRetiredError());
    }
    const duplicate = this.components.some((c) => c.productTypeId === productTypeId);
    if (duplicate) {
      return err(new DuplicateBundleComponentError(productTypeId));
    }
    const componentResult = BundleComponent.create({ productTypeId, quantity });
    if (componentResult.isErr()) {
      return err(componentResult.error);
    }

    this.components.push(componentResult.value);
    return ok(undefined);
  }

  removeComponent(productTypeId: string): Result<void, BundleAlreadyRetiredError | BundleComponentNotFoundError> {
    if (this.isRetired()) {
      return err(new BundleAlreadyRetiredError());
    }
    const idx = this.components.findIndex((c) => c.productTypeId === productTypeId);
    if (idx === -1) {
      return err(new BundleComponentNotFoundError(productTypeId));
    }
    this.components.splice(idx, 1);
    return ok(undefined);
  }
}
