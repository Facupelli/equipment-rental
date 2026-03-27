import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result, err, ok } from 'neverthrow';
import { RetireBundleCommand } from './retire-bundle.command';
import { BundleAlreadyRetiredError, BundleNotFoundError } from 'src/modules/catalog/domain/errors/catalog.errors';
import { BundleRepository } from 'src/modules/catalog/infrastructure/repositories/bundle.repository';

type RetireBundleResult = Result<void, BundleNotFoundError | BundleAlreadyRetiredError>;

@Injectable()
@CommandHandler(RetireBundleCommand)
export class RetireBundleService implements ICommandHandler<RetireBundleCommand, RetireBundleResult> {
  constructor(private readonly bundleRepo: BundleRepository) {}

  async execute(command: RetireBundleCommand): Promise<RetireBundleResult> {
    const bundle = await this.bundleRepo.load(command.bundleId, command.tenantId);
    if (!bundle) {
      return err(new BundleNotFoundError(command.bundleId));
    }

    const retireResult = bundle.retire();
    if (retireResult.isErr()) {
      return err(retireResult.error);
    }

    await this.bundleRepo.save(bundle);

    return ok(undefined);
  }
}
