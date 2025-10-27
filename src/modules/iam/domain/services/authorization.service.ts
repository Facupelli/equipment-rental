import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { RoleRepository } from "../../infrastructure/persistence/typeorm/role.repository";
// biome-ignore lint: /style/useImportType
import { UserRolesRepository } from "../../infrastructure/persistence/typeorm/user-roles.repository";
import { Permission } from "../enums/permissions.enum";

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly userRolesRepository: UserRolesRepository,
		private readonly roleRepository: RoleRepository,
	) {}

	async userHasPermission(
		userId: string,
		permission: Permission,
	): Promise<boolean> {
		const userRoles = await this.userRolesRepository.findByUserId(userId);

		if (!userRoles || !userRoles.hasAnyRole()) {
			return false;
		}

		const roles = await this.roleRepository.findByIds(userRoles.roleIds);

		return roles.some((role) => role.hasPermission(permission));
	}

	async userHasAnyPermission(
		userId: string,
		permissions: Permission[],
	): Promise<boolean> {
		const userRoles = await this.userRolesRepository.findByUserId(userId);

		if (!userRoles || !userRoles.hasAnyRole()) {
			return false;
		}

		const roles = await this.roleRepository.findByIds(userRoles.roleIds);

		return permissions.some((permission) =>
			roles.some((role) => role.hasPermission(permission)),
		);
	}

	async isUserAdmin(userId: string): Promise<boolean> {
		return this.userHasPermission(userId, Permission.ADMIN_ALL);
	}

	async getUserPermissions(userId: string): Promise<Permission[]> {
		const userRoles = await this.userRolesRepository.findByUserId(userId);

		if (!userRoles || !userRoles.hasAnyRole()) {
			return [];
		}

		const roles = await this.roleRepository.findByIds(userRoles.roleIds);

		const permissionSet = new Set<Permission>();
		roles.forEach((role) => {
			role.permissions.forEach((p) => permissionSet.add(p as Permission));
		});

		return Array.from(permissionSet);
	}
}
