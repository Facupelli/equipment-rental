import {
	type BadRequestException,
	Body,
	Controller,
	Post,
	Request,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "src/modules/iam/infrastructure/decorators/public.decorator";
// biome-ignore lint: /style/useImportType
import { RegisterUserDto } from "../application/commands/register-user/register-user.dto";
// biome-ignore lint: /style/useImportType
import { AuthenticationService } from "../domain/services/authentication.service";

@Public()
@Controller("auth")
export class AuthenticationController {
	constructor(private authService: AuthenticationService) {}

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
