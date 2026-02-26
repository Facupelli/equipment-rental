import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, loginUser } from "./auth.api";
import type { ApiResult } from "@/lib/api";
import type { LoginDto } from "./auth.schema";

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

export function useLogin(): UseMutationResult<
  ApiResult<null>,
  Error,
  { data: LoginDto }
> {
  const loginFn = useServerFn(loginUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginFn,
    onSuccess: async (result) => {
      if (result.success) {
        // Invalidate so useCurrentUser refetches with new session
        await queryClient.invalidateQueries({
          queryKey: authQueryKey.currentUser,
        });
      }
    },
  });
}
