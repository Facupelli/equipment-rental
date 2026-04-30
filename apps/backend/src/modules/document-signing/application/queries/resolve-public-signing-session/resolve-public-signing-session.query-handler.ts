import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { PublicSigningSessionLoader } from '../../public-signing-session.loader';
import { ResolvePublicSigningSessionQuery } from './resolve-public-signing-session.query';

@QueryHandler(ResolvePublicSigningSessionQuery)
export class ResolvePublicSigningSessionQueryHandler implements IQueryHandler<
  ResolvePublicSigningSessionQuery,
  { sessionId: string }
> {
  constructor(private readonly publicSigningSessionLoader: PublicSigningSessionLoader) {}

  async execute(query: ResolvePublicSigningSessionQuery): Promise<{ sessionId: string }> {
    const session = await this.publicSigningSessionLoader.loadRequiredPublicSession(query.rawToken);
    return { sessionId: session.id };
  }
}
