import type { ProblemDetailsError } from "@/shared/errors";
import { loginCustomer, registerCustomer } from "./portal-auth.api";
import { useMutation } from "@tanstack/react-query";
import type { LoginCustomerDto, RegisterCustomerDto } from "@repo/schemas";

export function useCustomerLogin() {
  // const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    ProblemDetailsError,
    LoginCustomerDto
  >({
    mutationFn: (data) => loginCustomer({ data }),
    onSuccess: async (result) => {
      if (result.success) {
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
    mutationFn: (data) => registerCustomer({ data }),
    onSuccess: async () => {},
    onError: (error) => {
      console.error(
        `[${error.problemDetails.status}] ${error.problemDetails.detail}`,
      );
    },
  });
}
