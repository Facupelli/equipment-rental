import { queryOptions, useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "./user.api";

export const userQueries = {
  all: () => ["user"] as const,
  me: () =>
    queryOptions({
      queryKey: [...userQueries.all(), "me"] as const,
      queryFn: () => getCurrentUser(),
      staleTime: 5 * 60 * 1000, // 5 minutes — auth user changes infrequently
    }),
};

export function useCurrentUser() {
  return useQuery(userQueries.me());
}
