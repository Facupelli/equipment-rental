import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get("jwt.secret"),
		});
	}

	async validate(payload: {
		email: string;
		sub: string;
		iat: number;
		exp: number;
	}) {
		return { id: payload.sub, email: payload.email };
	}
}
