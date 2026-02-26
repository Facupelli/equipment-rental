import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, loginUser } from "./auth.api";
import type { LoginDto } from "./auth.schema";
import type { ProblemDetailsError } from "@/shared/errors";
import { useRouter } from "@tanstack/react-router";

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
