import {
  useMutation,
  useQueryClient,
  type MutationOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { loginUserFn, logoutFn, registerTenantUserFn } from "./auth.api";
import type { LoginDto } from "./schemas/login-form.schema";
import type { ProblemDetailsError } from "@/shared/errors";
import { useRouter } from "@tanstack/react-router";
import type { RegisterDto, RegisterResponse } from "@repo/schemas";
import type { SessionUser } from "@/lib/session";
import { userQueries } from "../user/user.queries";

export function useLogin() {
  const router = useRouter();
  const login = useServerFn(loginUserFn);
  const queryClient = useQueryClient();

  return useMutation<SessionUser, ProblemDetailsError, LoginDto>({
    mutationFn: (data) => login({ data }),
    onSuccess: async (result) => {
      if (result.userId) {
        await queryClient.invalidateQueries({
          queryKey: userQueries.me().queryKey,
        });

        router.navigate({ to: "/dashboard" });
      }
    },
    onError: (error) => {
      console.error(
        `[${error.problemDetails.status}] ${error.problemDetails.detail}`,
      );
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<void, ProblemDetailsError>({
    mutationFn: () => logoutFn(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: userQueries.me().queryKey,
      });
      await router.navigate({ to: "/login" });
    },
  });
}

// REGISTER

type OwnerMutationOptions = Omit<
  MutationOptions<RegisterResponse, ProblemDetailsError, RegisterDto>,
  "mutationFn" | "mutationKey"
>;

export function useCreateTenantUser(options?: OwnerMutationOptions) {
  return useMutation<RegisterResponse, ProblemDetailsError, RegisterDto>({
    ...options,
    mutationFn: (data) => registerTenantUserFn({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
