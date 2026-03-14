import { ICommand } from '@nestjs/cqrs';
import { CreateProductTypeDto } from '../../dto/create-product-type.dto';

export class CreateProductTypeCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly props: CreateProductTypeDto,
  ) {}
}
