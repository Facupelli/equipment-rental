export enum Permission {
	// ADMIN
	// ============================================
	ADMIN_ALL = "admin:all",

	// CATALOG Module
	// ============================================
	CATALOG_READ = "catalog:read",
	CATALOG_WRITE = "catalog:write",
	CATALOG_DELETE = "catalog:delete",

	// INVENTORY Module
	// ============================================
	INVENTORY_READ = "inventory:read",
	INVENTORY_WRITE = "inventory:write",
	INVENTORY_DELETE = "inventory:delete",

	// BOOKING Module
	// ============================================
	BOOKING_READ = "booking:read",
	BOOKING_CREATE = "booking:create",
	BOOKING_CANCEL = "booking:cancel",
	BOOKING_CONFIRM = "booking:confirm",

	// IAM Module
	// ============================================
	USERS_READ = "users:read", // View user list
	USERS_MANAGE = "users:manage", // Suspend/activate users
	ROLES_ASSIGN = "roles:assign", // Assign roles to users
	ROLES_MANAGE = "roles:manage", // Create custom roles (future)
}

export function isAdminPermission(permission: Permission): boolean {
	return permission === Permission.ADMIN_ALL;
}

export function getAllNonAdminPermissions(): Permission[] {
	return Object.values(Permission).filter((p) => p !== Permission.ADMIN_ALL);
}
