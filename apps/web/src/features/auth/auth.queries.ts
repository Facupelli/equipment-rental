import {
  useMutation,
  useQuery,
  useQueryClient,
  type MutationOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, loginUser, registerTenantUser } from "./auth.api";
import type { LoginDto } from "./schemas/login-form.schema";
import type { ProblemDetailsError } from "@/shared/errors";
import { useRouter } from "@tanstack/react-router";
import type { CreaetTenantUserResponse, TenantUserCreate } from "@repo/schemas";

export const authQueryKey = {
  currentUser: ["currentUser"] as const,
};

export function useCurrentUser() {
  const getCurrentUserFn = useServerFn(getCurrentUser);

  return useQuery({
    queryKey: authQueryKey.currentUser,
    queryFn: () => getCurrentUserFn(),
    refetchOnWindowFocus: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const login = useServerFn(loginUser);
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, ProblemDetailsError, LoginDto>({
    mutationFn: (data) => login({ data }),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: authQueryKey.currentUser,
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

// REGISTER

type OwnerMutationOptions = Omit<
  MutationOptions<
    CreaetTenantUserResponse,
    ProblemDetailsError,
    TenantUserCreate
  >,
  "mutationFn" | "mutationKey"
>;

export function useCreateTenantUser(options?: OwnerMutationOptions) {
  return useMutation<
    CreaetTenantUserResponse,
    ProblemDetailsError,
    TenantUserCreate
  >({
    ...options,
    mutationFn: (data) => registerTenantUser({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
