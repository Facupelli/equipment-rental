import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import useDebounce from "@/shared/hooks/use-debounce";
import { useCoupons } from "../coupons.queries";
import { Route } from "@/routes/_admin/dashboard/pricing";

const DEBOUNCE_MS = 300;

export function useCouponsTab() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page, search: urlSearch } = Route.useSearch();

  const [inputValue, setInputValue] = useState(urlSearch ?? "");
  const debouncedSearch = useDebounce(inputValue, DEBOUNCE_MS);

  // Justified effect: syncing debounced input value → URL (external system).
  // Not derived state — this is an intentional write to the router on settle.
  useEffect(() => {
    const next = debouncedSearch.trim() || undefined;
    navigate({
      search: (prev) => ({
        ...prev,
        search: next,
        page: next !== urlSearch ? 1 : prev.page,
      }),
    });
  }, [debouncedSearch]);

  function handlePageChange(next: number) {
    navigate({ search: (prev) => ({ ...prev, page: next }) });
  }

  const query = useCoupons({
    page,
    limit: 10,
    search: urlSearch,
  });

  return {
    inputValue,
    setInputValue,
    query,
    page,
    handlePageChange,
  };
}
