import type { IQuery } from "@nestjs/cqrs";

export class GetDetailByIdQuery implements IQuery {
	constructor(public readonly orderId: string) {}
}
