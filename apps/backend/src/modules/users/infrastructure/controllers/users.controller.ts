import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { UsersService } from '../../application/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/test')
  @UseGuards(JwtAuthGuard)
  async test() {
    return this.usersService.testMe();
  }
}
