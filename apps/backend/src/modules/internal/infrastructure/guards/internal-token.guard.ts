import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Env } from 'src/config/env.schema';

@Injectable()
export class InternalTokenGuard implements CanActivate {
  private readonly token: string;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const token = this.configService.get('INTERNAL_API_TOKEN');
    this.token = token;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['x-internal-token'];

    if (!header || header !== this.token) {
      throw new UnauthorizedException('Invalid or missing internal token.');
    }

    return true;
  }
}
