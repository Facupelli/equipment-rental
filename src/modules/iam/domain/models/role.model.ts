import {
	getAllNonAdminPermissions,
	isAdminPermission,
	Permission,
} from "../enums/permissions.enum";

export class Role {
	private _permissions: Set<string>;

	private constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string,
		permissions: Permission[],
		public readonly isSystemRole: boolean,
		public readonly createdAt: Date,
	) {
		this._permissions = new Set(permissions);
	}

	static create(
		id: string,
		name: string,
		description: string,
		permissions: Permission[],
		isSystemRole: boolean = false,
	): Role {
		if (!name?.trim()) {
			throw new Error("Role name is required");
		}

		if (permissions.length === 0) {
			throw new Error("Role must have at least one permission");
		}

		return new Role(
			id,
			name.trim(),
			description,
			permissions,
			isSystemRole,
			new Date(),
		);
	}

	static reconstitute(
		id: string,
		name: string,
		description: string,
		permissions: Permission[],
		isSystemRole: boolean,
		createdAt: Date,
	): Role {
		return new Role(
			id,
			name,
			description,
			permissions,
			isSystemRole,
			createdAt,
		);
	}

	hasPermission(permission: Permission): boolean {
		if (this._permissions.has(Permission.ADMIN_ALL)) {
			return true;
		}

		return this._permissions.has(permission);
	}

	hasAnyPermission(permissions: Permission[]): boolean {
		return permissions.some((p) => this.hasPermission(p));
	}

	hasAllPermissions(permissions: Permission[]): boolean {
		return permissions.every((p) => this.hasPermission(p));
	}

	isAdmin(): boolean {
		return this._permissions.has(Permission.ADMIN_ALL);
	}

	grantPermission(permission: Permission): void {
		if (this.isSystemRole) {
			throw new Error("Cannot modify system roles");
		}

		if (isAdminPermission(permission)) {
			this._permissions.clear();
		}

		this._permissions.add(permission);
	}

	revokePermission(permission: Permission): void {
		if (this.isSystemRole) {
			throw new Error("Cannot modify system roles");
		}

		if (!this._permissions.has(permission)) {
			throw new Error("Permission not assigned to role");
		}

		this._permissions.delete(permission);

		if (this._permissions.size === 0) {
			throw new Error("Role must have at least one permission");
		}
	}

	get permissions(): Permission[] {
		if (this.isAdmin()) {
			return [Permission.ADMIN_ALL, ...getAllNonAdminPermissions()];
		}

		return Array.from(this._permissions) as Permission[];
	}

	getPermissionsForPersistence(): string[] {
		return Array.from(this._permissions);
	}
}
