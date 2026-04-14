import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { PublishBundleCommand } from './publish-bundle.command';
import {
  BundleAlreadyPublishedError,
  BundleAlreadyRetiredError,
  BundleCannotBePublishedBecauseAComponentHasNoAssetsError,
  BundleCannotBePublishedBecauseAComponentLacksActiveOwnerContractsError,
  BundleCannotBePublishedWithoutPricingTiersError,
  BundleNotFoundError,
} from 'src/modules/catalog/domain/errors/catalog.errors';
import { BundleRepository } from 'src/modules/catalog/infrastructure/repositories/bundle.repository';

type PublishBundleResult = Result<
  void,
  | BundleNotFoundError
  | BundleAlreadyPublishedError
  | BundleAlreadyRetiredError
  | BundleCannotBePublishedBecauseAComponentHasNoAssetsError
  | BundleCannotBePublishedBecauseAComponentLacksActiveOwnerContractsError
  | BundleCannotBePublishedWithoutPricingTiersError
>;

@Injectable()
@CommandHandler(PublishBundleCommand)
export class PublishBundleService implements ICommandHandler<PublishBundleCommand, PublishBundleResult> {
  constructor(
    private readonly bundleRepo: BundleRepository,
    // private readonly publicationEligibility: CatalogPublicationEligibilityService,
  ) {}

  async execute(command: PublishBundleCommand): Promise<PublishBundleResult> {
    const bundle = await this.bundleRepo.load(command.bundleId, command.tenantId);
    if (!bundle) {
      return err(new BundleNotFoundError(command.bundleId));
    }

    // TODO: do i need this check if product-type publish is already checking it and bundles are checking a product is published?
    // const eligibilityResult = await this.publicationEligibility.ensureBundleCanBePublished(
    //   command.tenantId,
    //   command.bundleId,
    //   bundle.getComponents(),
    // );
    // if (eligibilityResult.isErr()) {
    //   return err(eligibilityResult.error);
    // }

    const publishResult = bundle.publish();
    if (publishResult.isErr()) {
      return err(publishResult.error);
    }

    await this.bundleRepo.save(bundle);

    return ok(undefined);
  }
}
