import {
	type BadRequestException,
	Body,
	Controller,
	Post,
	Request,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "src/modules/auth/decorators/public.decorator";
import type { RegisterUserDto } from "../user/application/commands/register-user/register-user.dto";
// biome-ignore lint: /style/useImportType
import { AuthService } from "./auth.service";

@Public()
@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req): Promise<{access_token:string} | BadRequestException> {
    return this.authService.login(req.user);
  }

	@Post('register')
    async registerUser(@Body() dto: RegisterUserDto): Promise<string> {
			return this.authService.register(dto);
	}
}
