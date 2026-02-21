import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, _: Response, next: NextFunction): void {
    // We trust tenantId here because the JWT signature has already been verified.
    const tenantId = (req.user as any)?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context could not be resolved.');
    }

    this.tenantContext.run(tenantId, () => next());
  }
}
