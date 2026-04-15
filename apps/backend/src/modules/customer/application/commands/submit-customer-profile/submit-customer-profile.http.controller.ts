import { CustomerOnly } from 'src/core/decorators/customer-only.decorator';
import { Body, ConflictException, Controller, HttpCode, HttpStatus, NotFoundException, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  CannotSubmitApprovedProfileError,
  CustomerNotFoundError,
  CustomerProfileAlreadyExistsError,
  CustomerProfileNotFoundError,
} from '../../../domain/errors/customer.errors';
import { SubmitCustomerProfileCommand } from './submit-customer-profile.command';
import { SubmitCustomerProfileRequestDto } from './submit-customer-profile.request.dto';

@CustomerOnly()
@Controller('customer-profile')
export class SubmitCustomerProfileHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async submit(
    @CurrentUser() customer: AuthenticatedUser,
    @Body() dto: SubmitCustomerProfileRequestDto,
  ): Promise<void> {
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
        dto.instagram,
        dto.knowsExistingCustomer,
        dto.knownCustomerName,
        dto.heardAboutUs,
        dto.heardAboutUsOther,
        dto.contact1Name,
        dto.contact1Phone,
        dto.contact1Relationship,
        dto.contact2Name,
        dto.contact2Phone,
        dto.contact2Relationship,
      ),
    );

    if (result.isErr()) {
      const error = result.error;

      if (error instanceof CustomerNotFoundError || error instanceof CustomerProfileNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CustomerProfileAlreadyExistsError || error instanceof CannotSubmitApprovedProfileError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
