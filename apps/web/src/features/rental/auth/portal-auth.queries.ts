import { useMutation } from "@tanstack/react-query";
import type { SessionUser } from "@/lib/session";
import type { ProblemDetailsError } from "@/shared/errors";
import { portalCustomerKeys } from "../customer/customer.queries";
import type { LoginCustomerInput } from "./login/customer-login-form.schema";
import { loginCustomerFn, registerCustomerFn } from "./portal-auth.api";
import type { RegisterCustomerInput } from "./register/customer-register-form.schema";

export function useCustomerLogin() {
	// const queryClient = useQueryClient();

	return useMutation<SessionUser, ProblemDetailsError, LoginCustomerInput>({
		mutationFn: (data) => loginCustomerFn({ data }),
		meta: {
			invalidates: portalCustomerKeys.all(),
		},
		onSuccess: async (result) => {
			if (result.userId) {
				// await queryClient.invalidateQueries({
				//   queryKey: authQueryKey.currentUser,
				// });
			}
		},
		onError: (error) => {
			console.error(
				`[${error.problemDetails.status}] ${error.problemDetails.detail}`,
			);
		},
	});
}

export function useCustomerRegister() {
	return useMutation<string, ProblemDetailsError, RegisterCustomerInput>({
		mutationFn: (data) => registerCustomerFn({ data }),
		onError: (error) => {
			console.error(
				`[${error.problemDetails.status}] ${error.problemDetails.detail}`,
			);
		},
	});
}
