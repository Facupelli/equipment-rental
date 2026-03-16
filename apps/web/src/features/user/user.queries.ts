import { queryOptions, useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "./user.api";

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const userKeys = {
  all: () => ["user"] as const,
  me: () => [...userKeys.all(), "me"] as const,
};

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useCurrentUser() {
  return useQuery(
    queryOptions({
      queryKey: userKeys.me(),
      queryFn: () => getCurrentUser(),
      staleTime: 5 * 60 * 1000,
    }),
  );
}
