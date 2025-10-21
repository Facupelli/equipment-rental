export enum CustomerStatus {
	ACTIVE = "ACTIVE",
	SUSPENDED = "SUSPENDED",
}

export interface CreateCustomerProps {
	id: string;
	name: string;
	email: string;
	phone: string;
}

export class Customer {
	private _id: string;
	private _name: string;
	private _email: string;
	private _phone: string;
	private _status: CustomerStatus;
	private _registeredAt: Date;

	private constructor(
		id: string,
		name: string,
		email: string,
		phone: string,
		status: CustomerStatus,
		registeredAt: Date,
	) {
		this._id = id;
		this._name = name;
		this._email = email;
		this._phone = phone;
		this._status = status;
		this._registeredAt = registeredAt;
	}

	public static create(props: CreateCustomerProps): Customer {
		if (!props.name?.trim()) {
			throw new Error("Customer name is required");
		}
		if (!Customer.isValidEmail(props.email)) {
			throw new Error("Invalid email format");
		}
		if (!Customer.isValidPhone(props.phone)) {
			throw new Error("Invalid phone format");
		}

		return new Customer(
			props.id,
			props.name.trim(),
			props.email.trim().toLowerCase(),
			props.phone.trim(),
			CustomerStatus.ACTIVE,
			new Date(),
		);
	}

	public suspend(): void {
		if (this._status === CustomerStatus.SUSPENDED) {
			throw new Error("Customer is already suspended");
		}
		this._status = CustomerStatus.SUSPENDED;
	}

	public activate(): void {
		if (this._status === CustomerStatus.ACTIVE) {
			throw new Error("Customer is already active");
		}
		this._status = CustomerStatus.ACTIVE;
	}

	public isSuspended(): boolean {
		return this._status === CustomerStatus.SUSPENDED;
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

	get status(): CustomerStatus {
		return this._status;
	}

	get registeredAt(): Date {
		return this._registeredAt;
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
