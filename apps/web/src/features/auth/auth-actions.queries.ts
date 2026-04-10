import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
	loginUserFn,
	logoutFn,
	registerTenantUserFn,
} from "./auth-actions.api";
import type { LoginDto } from "./schemas/login-form.schema";
import type { ProblemDetailsError } from "@/shared/errors";
import { useRouter } from "@tanstack/react-router";
import type { RegisterDto, RegisterResponse } from "@repo/schemas";
import type { SessionUser } from "@/lib/session";
import { userKeys } from "../user/user.queries";

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type OwnerMutationOptions = Omit<
	UseMutationOptions<RegisterResponse, ProblemDetailsError, RegisterDto>,
	"mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useLogin() {
	const login = useServerFn(loginUserFn);

	return useMutation<SessionUser, ProblemDetailsError, LoginDto>({
		mutationFn: (data) => login({ data }),
		meta: {
			invalidates: userKeys.all(),
		},
	});
}

export function useLogout() {
	const router = useRouter();

	return useMutation<void, ProblemDetailsError>({
		mutationFn: () => logoutFn(),
		meta: {
			invalidates: userKeys.all(),
		},
		onSuccess: async () => {
			await router.navigate({ to: "/admin/login" });
		},
	});
}

export function useCreateTenantUser(options?: OwnerMutationOptions) {
	return useMutation<RegisterResponse, ProblemDetailsError, RegisterDto>({
		...options,
		mutationFn: (data) => registerTenantUserFn({ data }),
	});
}
