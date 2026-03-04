import { Body, Controller, Post } from '@nestjs/common';
import { CreateAssetDto } from '../../application/dto/create-asset.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateAssetCommand } from '../../application/commands/create-asset/create-asset.command';

@Controller('assets')
export class AssetController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createAsset(@Body() dto: CreateAssetDto): Promise<string> {
    const command = new CreateAssetCommand(dto);
    return await this.commandBus.execute(command);
  }
}
