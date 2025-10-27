export class UserRoles {
	constructor(
		public readonly userId: string,
		private _roleIds: string[],
	) {}

	hasRole(roleId: string): boolean {
		return this._roleIds.includes(roleId);
	}

	hasAnyRole(): boolean {
		return this._roleIds.length > 0;
	}

	get roleIds(): string[] {
		return [...this._roleIds];
	}

	assignRole(roleId: string): void {
		if (this._roleIds.includes(roleId)) {
			throw new Error("Role already assigned");
		}
		this._roleIds.push(roleId);
	}

	revokeRole(roleId: string): void {
		const index = this._roleIds.indexOf(roleId);
		if (index === -1) {
			throw new Error("Role not assigned to user");
		}
		this._roleIds.splice(index, 1);
	}
}
