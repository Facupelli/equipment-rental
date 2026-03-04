import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAssetCommand } from './create-asset.command';
import { AssetRepositoryPort } from '../../../domain/ports/asset.repository.port';
import { Asset } from '../../../domain/entities/asset.entity';

@CommandHandler(CreateAssetCommand)
export class CreateAssetCommandHandler implements ICommandHandler<CreateAssetCommand> {
  constructor(private readonly assetRepository: AssetRepositoryPort) {}

  async execute(command: CreateAssetCommand) {
    const asset = Asset.create(command.props);
    return await this.assetRepository.save(asset);
  }
}
