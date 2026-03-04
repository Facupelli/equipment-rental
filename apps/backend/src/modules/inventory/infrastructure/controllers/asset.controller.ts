import { Body, Controller, Post } from '@nestjs/common';
import { CreateAssetDto } from '../../application/dto/create-asset.dto';
import { AssetService } from '../../application/asset.service';

@Controller('assets')
export class AssetController {
  constructor(private readonly assetSerivce: AssetService) {}

  @Post()
  async createAsset(@Body() dto: CreateAssetDto): Promise<string> {
    return this.assetSerivce.create(dto);
  }
}
