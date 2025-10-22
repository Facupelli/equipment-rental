export class Money {
	constructor(
		readonly amount: number,
		readonly currency: string = "USD",
	) {}

	static fromAmount(amount: number, currency = "USD"): Money {
		// Store as integer cents to avoid float precision issues
		return new Money(Math.round(amount * 100), currency);
	}

	add(other: Money): Money {
		this.assertSameCurrency(other);
		return new Money(this.amount + other.amount, this.currency);
	}

	subtract(other: Money): Money {
		this.assertSameCurrency(other);
		return new Money(this.amount - other.amount, this.currency);
	}

	multiply(factor: number): Money {
		return new Money(this.amount * factor, this.currency);
	}

	isNegative(): boolean {
		return this.amount < 0;
	}

	percentage(percent: number): Money {
		return new Money(Math.round(this.amount * percent), this.currency);
	}

	toDecimal(): number {
		return this.amount / 100;
	}

	isGreaterThan(other: Money): boolean {
		this.assertSameCurrency(other);
		return this.amount > other.amount;
	}

	private assertSameCurrency(other: Money): void {
		if (this.currency !== other.currency) {
			throw new Error(`Cannot operate on different currencies`);
		}
	}
}
