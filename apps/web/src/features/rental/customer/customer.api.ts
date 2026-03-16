import { apiFetch } from "@/lib/api";
import { type MeCustomerResponseDto } from "@repo/schemas";
import { createServerFn } from "@tanstack/react-start";

const apiUrl = "/customers";

export const getMeCustomer = createServerFn({ method: "GET" }).handler(
  async ({ data }): Promise<MeCustomerResponseDto> => {
    const result = await apiFetch<MeCustomerResponseDto>(`${apiUrl}/me`, {
      method: "GET",
      params: data,
    });

    return result;
  },
);
