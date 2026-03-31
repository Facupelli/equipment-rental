import { CustomerOnly } from 'src/core/decorators/customer-only.decorator';
import { Body, ConflictException, Controller, HttpCode, HttpStatus, NotFoundException, Put } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/modules/auth/public/authenticated-user';
import {
  CannotSubmitApprovedProfileError,
  CustomerNotFoundError,
  CustomerProfileNotFoundError,
} from '../../../domain/errors/customer.errors';
import { ResubmitCustomerProfileCommand } from './resubmit-customer-profile.command';
import { ResubmitCustomerProfileRequestDto } from './resubmit-customer-profile.request.dto';

@CustomerOnly()
@Controller('customer-profile')
export class ResubmitCustomerProfileHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async resubmit(
    @CurrentUser() customer: AuthenticatedUser,
    @Body() dto: ResubmitCustomerProfileRequestDto,
  ): Promise<void> {
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
      const error = result.error;

      if (error instanceof CustomerNotFoundError || error instanceof CustomerProfileNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof CannotSubmitApprovedProfileError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
