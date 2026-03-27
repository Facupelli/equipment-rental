import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SubmitCustomerProfileDto } from '../../application/dto/submit-customer-profile.dto';
import { SubmitCustomerProfileCommand } from '../../application/commands/submit-customer-profile/submit-customer-profile.command';
import { CustomerNotFoundException } from '../../domain/exceptions/customer.exceptions';
import { ResubmitCustomerProfileCommand } from '../../application/commands/resubmit-customer-profile/resubmit-customer-profile.command';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import { CustomerProfileResponseDto } from '@repo/schemas';
import { GetCustomerProfileQuery } from '../../application/queries/get-customer-profile/get-customer-profile.query';

@Controller('customer-profile')
export class CustomerProfileHttpController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async submit(@CurrentUser() customer: AuthenticatedUser, @Body() dto: SubmitCustomerProfileDto): Promise<void> {
    const result = await this.commandBus.execute(
      new SubmitCustomerProfileCommand(
        customer.id,
        dto.fullName,
        dto.phone,
        new Date(dto.birthDate),
        dto.documentNumber,
        dto.identityDocumentPath,
        dto.address,
        dto.city,
        dto.stateRegion,
        dto.country,
        dto.occupation,
        dto.company,
        dto.taxId,
        dto.businessName,
        dto.bankName,
        dto.accountNumber,
        dto.contact1Name,
        dto.contact1Relationship,
        dto.contact2Name,
        dto.contact2Relationship,
      ),
    );

    if (result.isErr()) {
      if (result.error instanceof CustomerNotFoundException) {
        throw new NotFoundException(result.error.message);
      }
      throw result.error;
    }
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async resubmit(@CurrentUser() customer: AuthenticatedUser, @Body() dto: SubmitCustomerProfileDto): Promise<void> {
    const result = await this.commandBus.execute(
      new ResubmitCustomerProfileCommand(
        customer.id,
        dto.fullName,
        dto.phone,
        new Date(dto.birthDate),
        dto.documentNumber,
        dto.identityDocumentPath,
        dto.address,
        dto.city,
        dto.stateRegion,
        dto.country,
        dto.occupation,
        dto.company,
        dto.taxId,
        dto.businessName,
        dto.bankName,
        dto.accountNumber,
        dto.contact1Name,
        dto.contact1Relationship,
        dto.contact2Name,
        dto.contact2Relationship,
      ),
    );

    if (result.isErr()) {
      if (result.error instanceof CustomerNotFoundException) {
        throw new NotFoundException(result.error.message);
      }
      throw result.error;
    }
  }

  @Get(':id')
  getCustomerProfile(@Param('id') id: string): Promise<CustomerProfileResponseDto> {
    return this.queryBus.execute(new GetCustomerProfileQuery(id));
  }
}
