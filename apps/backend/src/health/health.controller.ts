import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/modules/auth/infrastructure/is-public.decorator';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
