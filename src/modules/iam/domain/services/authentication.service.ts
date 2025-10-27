import { BadRequestException, Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
// biome-ignore lint: /style/useImportType
import { RegisterUserDto } from "../../application/commands/register-user/register-user.dto";
// biome-ignore lint: /style/useImportType
import { UserFacade } from "../../user.facade";
import type { User } from "../models/user.model";

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly jwtService: JwtService,
	) {}

	async validateUser(email: string, password: string): Promise<User> {
		const user = await this.userFacade.getByEmail(email);
		const isMatch: boolean = bcrypt.compareSync(password, user.passwordHash);

		if (!isMatch) {
			throw new BadRequestException("Password does not match");
		}

		return user;
	}

	async login(user: User) {
		const payload = { email: user.email, sub: user.id };
		console.log({ userId: user.id });
		return {
			access_token: this.jwtService.sign(payload),
		};
	}

	async register(dto: RegisterUserDto): Promise<string> {
		const userId = await this.userFacade.registerUser(dto);
		return userId;
	}
}
