import type {
	CreateUserProfileDto,
	ProblemDetails,
	UpdateUserProfileDto,
	UserProfileResponseDto,
} from "@repo/schemas";
import {
	queryOptions,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import {
	createUserProfile,
	getUserProfile,
	updateUserProfile,
} from "./user-profile.api";

type CreateUserProfileVariables = {
	userId: string;
	dto: CreateUserProfileDto;
};

type UpdateUserProfileVariables = {
	userId: string;
	dto: UpdateUserProfileDto;
};

export const userProfileKeys = {
	all: () => ["user-profile"] as const,
	details: () => [...userProfileKeys.all(), "detail"] as const,
	detail: (userId: string) => [...userProfileKeys.details(), userId] as const,
};

export const userProfileQueries = {
	detail: (userId: string) =>
		queryOptions<UserProfileResponseDto, ProblemDetailsError>({
			queryKey: userProfileKeys.detail(userId),
			queryFn: async () => {
				const result = await getUserProfile({ data: userId });

				if (isProblemDetailsResult(result)) {
					throw new ProblemDetailsError(result.error);
				}

				return result;
			},
		}),
};

type UserProfileDetailQueryOptions<TData = UserProfileResponseDto> = Omit<
	UseQueryOptions<UserProfileResponseDto, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type CreateUserProfileMutationOptions = Omit<
	UseMutationOptions<
		{ id: string },
		ProblemDetailsError,
		CreateUserProfileVariables
	>,
	"mutationFn"
>;

type UpdateUserProfileMutationOptions = Omit<
	UseMutationOptions<void, ProblemDetailsError, UpdateUserProfileVariables>,
	"mutationFn"
>;

export function useUserProfile<TData = UserProfileResponseDto>(
	userId: string,
	options?: UserProfileDetailQueryOptions<TData>,
) {
	const { queryKey, queryFn } = userProfileQueries.detail(userId);

	return useQuery({
		...options,
		queryKey,
		queryFn,
		enabled: (options?.enabled ?? true) && !!userId,
	});
}

export function useCreateUserProfile(
	options?: CreateUserProfileMutationOptions,
) {
	return useMutation<
		{ id: string },
		ProblemDetailsError,
		CreateUserProfileVariables
	>({
		...options,
		mutationFn: async ({ userId, dto }) => {
			const result = await createUserProfile({ data: { userId, dto } });

			if (isProblemDetailsResult(result)) {
				throw new ProblemDetailsError(result.error);
			}

			return result;
		},
		meta: {
			invalidates: (variables: CreateUserProfileVariables) =>
				userProfileKeys.detail(variables.userId),
		},
	});
}

export function useUpdateUserProfile(
	options?: UpdateUserProfileMutationOptions,
) {
	return useMutation<void, ProblemDetailsError, UpdateUserProfileVariables>({
		...options,
		mutationFn: async ({ userId, dto }) => {
			const result = await updateUserProfile({ data: { userId, dto } });

			if (isProblemDetailsResult(result)) {
				throw new ProblemDetailsError(result.error);
			}
		},
		meta: {
			invalidates: (variables: UpdateUserProfileVariables) =>
				userProfileKeys.detail(variables.userId),
		},
	});
}

function isProblemDetailsResult(
	result: unknown,
): result is { error: ProblemDetails } {
	return typeof result === "object" && result !== null && "error" in result;
}
