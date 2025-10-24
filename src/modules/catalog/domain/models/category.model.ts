export class Category {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string | null,
	) {}

	static create(
		id: string,
		name: string,
		description: string | null,
	): Category {
		return new Category(id, name, description);
	}

	static reconstitute(
		id: string,
		name: string,
		description: string | null,
	): Category {
		return new Category(id, name, description);
	}
}
