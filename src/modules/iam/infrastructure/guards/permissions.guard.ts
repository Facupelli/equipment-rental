import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { Reflector } from "@nestjs/core";
// biome-ignore lint: /style/useImportType
import { AuthorizationFacade } from "../../authorization.facade";
import type { Permission } from "../../domain/enums/permissions.enum";
import { PERMISSIONS_KEY } from "../decorators/permission.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly authorizationFacade: AuthorizationFacade,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
			PERMISSIONS_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!requiredPermissions || requiredPermissions.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user || !user.id) {
			throw new ForbiddenException("User not authenticated");
		}

		const hasPermission = await this.authorizationFacade.userHasAnyPermission(
			user.id,
			requiredPermissions,
		);

		if (!hasPermission) {
			throw new ForbiddenException(
				`Missing required permissions: ${requiredPermissions.join(", ")}`,
			);
		}

		return true;
	}
}
