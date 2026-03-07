import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBundleDto } from '../../application/dto/create-bundle.dto';
import { CreateBundleCommand } from '../../application/commands/create-bundle/create-bundle.command';

@Controller('bundles')
export class BundleController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createBundle(@Body() dto: CreateBundleDto): Promise<string> {
    const command = new CreateBundleCommand(dto.billingUnitId, dto.name, dto.components);

    return await this.commandBus.execute(command);
  }

  // @Get()
  // @Paginated()
  // async getProductTypes(@Query() dto: GetProductTypesQueryDto): Promise<ProductTypeResponse[]> {
  //   const query = new GetProductTypesQuery(dto.categoryId, dto.isActive, dto.search);

  //   return await this.queryBus.execute(query);
  // }

  // @Get(':id')
  // async getProductTypeById(@Param('id') id: string): Promise<ProductTypeResponse> {
  //   const result = await this.queryBus.execute(new GetProductTypeByIdQuery(id));

  //   if (!result) {
  //     throw new NotFoundException('Product type not found');
  //   }

  //   return result;
  // }
}
