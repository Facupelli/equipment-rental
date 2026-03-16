import type { ProblemDetailsError } from "@/shared/errors";
import { useMutation } from "@tanstack/react-query";
import type { LoginCustomerDto, RegisterCustomerDto } from "@repo/schemas";
import { loginCustomerFn, registerCustomerFn } from "./portal-auth.api";
import type { SessionUser } from "@/lib/session";

export function useCustomerLogin() {
  // const queryClient = useQueryClient();

  return useMutation<SessionUser, ProblemDetailsError, LoginCustomerDto>({
    mutationFn: (data) => loginCustomerFn({ data }),
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
  return useMutation<string, ProblemDetailsError, RegisterCustomerDto>({
    mutationFn: (data) => registerCustomerFn({ data }),
    onSuccess: async () => {},
    onError: (error) => {
      console.error(
        `[${error.problemDetails.status}] ${error.problemDetails.detail}`,
      );
    },
  });
}
