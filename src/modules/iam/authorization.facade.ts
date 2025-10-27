import { Injectable } from "@nestjs/common";
import type { Permission } from "./domain/enums/permissions.enum";
// biome-ignore lint: /style/useImportType
import { AuthorizationService } from "./domain/services/authorization.service";

@Injectable()
export class AuthorizationFacade {
	constructor(private readonly authorizationService: AuthorizationService) {}

	async userHasAnyPermission(
		userId: string,
		permissions: Permission[],
	): Promise<boolean> {
		return this.authorizationService.userHasAnyPermission(userId, permissions);
	}
}
