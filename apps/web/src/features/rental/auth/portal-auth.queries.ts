import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { logoutFn } from "@/features/auth/auth-actions.api";
import { getOptionalCustomerSessionFn } from "@/features/auth/auth-guards.api";
import type { SessionUser } from "@/lib/session";
import type { ProblemDetailsError } from "@/shared/errors";
import { portalCustomerKeys } from "../customer/customer.queries";
import type { LoginCustomerInput } from "./login/customer-login-form.schema";
import { loginCustomerFn, registerCustomerFn } from "./portal-auth.api";
import type { RegisterCustomerInput } from "./register/customer-register-form.schema";

export const portalAuthKeys = {
  all: () => ["portal-auth"] as const,
  currentSession: () => [...portalAuthKeys.all(), "current-session"] as const,
};

export const portalAuthQueries = {
  currentSession: () =>
    queryOptions<SessionUser | null, ProblemDetailsError>({
      queryKey: portalAuthKeys.currentSession(),
      queryFn: () => getOptionalCustomerSessionFn(),
      staleTime: 5 * 60 * 1000,
    }),
};

export function useCurrentPortalSession() {
  return useQuery({
    ...portalAuthQueries.currentSession(),
  });
}

export function useCustomerLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<SessionUser, ProblemDetailsError, LoginCustomerInput>({
    mutationFn: (data) => loginCustomerFn({ data }),
    meta: {
      invalidates: portalCustomerKeys.all(),
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: portalAuthKeys.all() });
      await router.invalidate();
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

export function useCustomerLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, ProblemDetailsError>({
    mutationFn: () => logoutFn(),
    meta: {
      invalidates: portalCustomerKeys.all(),
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: portalAuthKeys.all() });
      queryClient.removeQueries({ queryKey: portalCustomerKeys.all() });
      await router.invalidate();
      await router.navigate({
        to: "/login",
        search: { redirectTo: "/rental" },
      });
    },
  });
}
