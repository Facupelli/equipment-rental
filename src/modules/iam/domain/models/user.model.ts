export enum UserStatus {
	ACTIVE = "ACTIVE",
	SUSPENDED = "SUSPENDED",
}

export interface CreateUserProps {
	id: string;
	name: string;
	email: string;
	phone: string;
	passwordHash: string;
}

export class User {
	private _id: string;
	private _name: string;
	private _email: string;
	private _phone: string;
	private _passwordHash: string;
	private _status: UserStatus;
	private _registeredAt: Date;
	private _lastLoginAt: Date | null;

	private constructor(
		id: string,
		name: string,
		email: string,
		phone: string,
		passwordHash: string,
		status: UserStatus,
		registeredAt: Date,
		lastLoginAt: Date | null = null,
	) {
		this._id = id;
		this._name = name;
		this._email = email;
		this._phone = phone;
		this._passwordHash = passwordHash;
		this._status = status;
		this._registeredAt = registeredAt;
		this._lastLoginAt = lastLoginAt;
	}

	public static create(props: CreateUserProps): User {
		if (!props.name?.trim()) {
			throw new Error("User name is required");
		}
		if (!User.isValidEmail(props.email)) {
			throw new Error("Invalid email format");
		}
		if (!User.isValidPhone(props.phone)) {
			throw new Error("Invalid phone format");
		}
		if (!props.passwordHash) {
			throw new Error("Password hash is required");
		}

		return new User(
			props.id,
			props.name.trim(),
			props.email.trim().toLowerCase(),
			props.phone.trim(),
			props.passwordHash,
			UserStatus.ACTIVE,
			new Date(),
			null,
		);
	}

	static reconstitute(
		id: string,
		name: string,
		email: string,
		phone: string,
		passwordHash: string,
		status: UserStatus,
		registeredAt: Date,
		lastLoginAt: Date | null = null,
	): User {
		return new User(
			id,
			name,
			email,
			phone,
			passwordHash,
			status,
			registeredAt,
			lastLoginAt,
		);
	}

	public suspend(): void {
		if (this._status === UserStatus.SUSPENDED) {
			throw new Error("User is already suspended");
		}
		this._status = UserStatus.SUSPENDED;
	}

	public activate(): void {
		if (this._status === UserStatus.ACTIVE) {
			throw new Error("User is already active");
		}
		this._status = UserStatus.ACTIVE;
	}

	public isSuspended(): boolean {
		return this._status === UserStatus.SUSPENDED;
	}

	public recordLogin(): void {
		this._lastLoginAt = new Date();
	}

	get id(): string {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get email(): string {
		return this._email;
	}

	get phone(): string {
		return this._phone;
	}

	get status(): UserStatus {
		return this._status;
	}

	get registeredAt(): Date {
		return this._registeredAt;
	}

	get lastLoginAt(): Date | null {
		return this._lastLoginAt;
	}

	get passwordHash(): string {
		return this._passwordHash;
	}

	private static isValidEmail(email: string): boolean {
		if (!email) return false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	private static isValidPhone(phone: string): boolean {
		if (!phone) return false;
		// Simple validation: at least 10 digits
		const digitsOnly = phone.replace(/\D/g, "");
		return digitsOnly.length >= 10 && digitsOnly.length <= 20;
	}
}
