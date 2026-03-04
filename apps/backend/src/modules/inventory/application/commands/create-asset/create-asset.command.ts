import { ICommand } from '@nestjs/cqrs';
import { CreateAssetDto } from '../../dto/create-asset.dto';

export class CreateAssetCommand implements ICommand {
  constructor(public readonly props: CreateAssetDto) {}
}
