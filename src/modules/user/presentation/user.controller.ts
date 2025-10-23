import {  Controller, Get, Param, } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import {  QueryBus } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import  { GetUserByIdDto } from "../application/queries/get-user-by-id.dto";
import { GetUserByIdQuery } from "../application/queries/get-user-by-id.query";
import type { User } from "../domain/models/user.model";

@Controller("users")
export class UserController {
	constructor(
		private readonly queryBus: QueryBus,
	) {}

	@Get(":userId")
    async getUserById(@Param() params: GetUserByIdDto): Promise<User | null> {
      const user = await this.queryBus.execute(new GetUserByIdQuery(
        params.userId,
      ));
  
      return user;
    }
}
