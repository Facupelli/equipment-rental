export class Location {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string | null,
		public readonly createdAt: Date,
	) {}

	static create(
		id: string,
		name: string,
		description: string | null,
	): Location {
		return new Location(id, name, description, new Date());
	}

	static reconstitute(
		id: string,
		name: string,
		description: string | null,
		createdAt: Date,
	): Location {
		return new Location(id, name, description, createdAt);
	}
}
