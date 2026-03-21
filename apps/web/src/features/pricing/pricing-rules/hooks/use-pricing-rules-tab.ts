import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import useDebounce from "@/shared/hooks/use-debounce";
import { usePricingRules } from "../pricing-rules.queries";
import { Route } from "@/routes/_admin/dashboard/pricing/index";

const DEBOUNCE_MS = 300;

export function usePricingRulesTab() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page, search: urlSearch } = Route.useSearch();

  const [inputValue, setInputValue] = useState(urlSearch ?? "");
  const debouncedSearch = useDebounce(inputValue, DEBOUNCE_MS);

  // Sync debounced value → URL, reset page on new search term
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

  const query = usePricingRules({
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
