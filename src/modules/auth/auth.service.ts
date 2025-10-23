import { BadRequestException, Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import type { RegisterUserDto } from "../user/application/commands/register-user/register-user.dto";
import type { User } from "../user/domain/models/user.model";
// biome-ignore lint: /style/useImportType
import { UserFacade } from "../user/user.facade";

@Injectable()
export class AuthService {
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
		return {
			access_token: this.jwtService.sign(payload),
		};
	}

	async register(dto: RegisterUserDto): Promise<string> {
		const userId = await this.userFacade.registerUser(dto);
		return userId;
	}
}
