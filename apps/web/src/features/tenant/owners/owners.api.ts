import { apiFetch } from "@/lib/api";
import {
	createOwnerContractSchema,
	createOwnerSchema,
	type CreateOwnerContractDto,
	type CreateOwnerDto,
	type GetOwnerResponseDto,
	type OwnerListResponse,
} from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/owners";

export const createOwner = createServerFn({ method: "POST" })
	.inputValidator((data: CreateOwnerDto) => createOwnerSchema.parse(data))
	.handler(async ({ data }): Promise<string> => {
		const result = await apiFetch<string>(apiUrl, {
			method: "POST",
			body: data,
		});

		return result;
	});

export const getOwners = createServerFn({ method: "GET" }).handler(
	async (): Promise<OwnerListResponse> => {
		const result = await apiFetch<OwnerListResponse>(apiUrl, {
			method: "GET",
		});

		return result;
	},
);

export const getOwner = createServerFn({ method: "GET" })
	.inputValidator((ownerId: string) => ownerId)
	.handler(async ({ data: ownerId }): Promise<GetOwnerResponseDto> => {
		const result = await apiFetch<GetOwnerResponseDto>(`${apiUrl}/${ownerId}`, {
			method: "GET",
		});

		return result;
	});

export const createOwnerContract = createServerFn({ method: "POST" })
	.inputValidator((data: { dto: CreateOwnerContractDto }) => ({
		dto: createOwnerContractSchema.parse(data.dto),
	}))
	.handler(async ({ data: { dto } }): Promise<string> => {
		const result = await apiFetch<string>(
			`${apiUrl}/${dto.ownerId}/contracts`,
			{
				method: "POST",
				body: dto,
			},
		);

		return result;
	});
