import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RetireBundleCommand } from './publish-bundle.command';
import { BundleRepositoryPort } from 'src/modules/catalog/domain/ports/bundle-repository.port';
import { BundleAlreadyRetiredException } from 'src/modules/catalog/domain/exceptions/bundle.exceptions';

@Injectable()
@CommandHandler(RetireBundleCommand)
export class RetireBundleCommandHandler implements ICommandHandler<RetireBundleCommand, void> {
  constructor(private readonly bundleRepo: BundleRepositoryPort) {}

  async execute(command: RetireBundleCommand): Promise<void> {
    const bundle = await this.bundleRepo.load(command.bundleId);
    if (!bundle) {
      throw new NotFoundException(`Bundle ${command.bundleId} not found`);
    }

    try {
      bundle.retire();
    } catch (e) {
      if (e instanceof BundleAlreadyRetiredException) {
        throw new ConflictException(e.message);
      }
      throw e;
    }

    await this.bundleRepo.save(bundle);
  }
}
