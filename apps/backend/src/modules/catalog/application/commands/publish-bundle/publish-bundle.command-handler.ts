import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublishBundleCommand } from './publish-bundle.command';
import { BundleRepositoryPort } from 'src/modules/catalog/domain/ports/bundle-repository.port';
import {
  BundleAlreadyPublishedException,
  BundleAlreadyRetiredException,
} from 'src/modules/catalog/domain/exceptions/bundle.exceptions';

@Injectable()
@CommandHandler(PublishBundleCommand)
export class PublishBundleCommandHandler implements ICommandHandler<PublishBundleCommand, void> {
  constructor(private readonly bundleRepo: BundleRepositoryPort) {}

  async execute(command: PublishBundleCommand): Promise<void> {
    const bundle = await this.bundleRepo.load(command.bundleId);
    if (!bundle) {
      throw new NotFoundException(`Bundle ${command.bundleId} not found`);
    }

    try {
      bundle.publish();
    } catch (e) {
      if (e instanceof BundleAlreadyPublishedException) {
        throw new ConflictException(e.message);
      }
      if (e instanceof BundleAlreadyRetiredException) {
        throw new ConflictException(e.message);
      }
      throw e;
    }

    await this.bundleRepo.save(bundle);
  }
}
