import { issueCustomerGoogleAuthStateSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class IssueCustomerGoogleAuthStateRequestDto extends createZodDto(issueCustomerGoogleAuthStateSchema) {}
