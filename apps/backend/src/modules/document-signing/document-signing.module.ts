import { Module } from '@nestjs/common';

import { SigningSessionRepository } from './infrastructure/persistence/repositories/signing-session.repository';

@Module({
  providers: [SigningSessionRepository],
})
export class DocumentSigningModule {}
