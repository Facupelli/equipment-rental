import { PromotionActivationType } from "@repo/types";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/_admin/dashboard/pricing";
import useDebounce from "@/shared/hooks/use-debounce";
import { usePromotions } from "../promotions.queries";

const DEBOUNCE_MS = 300;

export function usePromotionsTab() {
	const navigate = useNavigate({ from: Route.fullPath });
	const { page, search: urlSearch, activationType } = Route.useSearch();

	const [inputValue, setInputValue] = useState(urlSearch ?? "");
	const debouncedSearch = useDebounce(inputValue, DEBOUNCE_MS);

	useEffect(() => {
		const next = debouncedSearch.trim() || undefined;
		navigate({
			search: (prev) => ({
				...prev,
				search: next,
				page: next !== urlSearch ? 1 : prev.page,
			}),
		});
	}, [debouncedSearch, navigate, urlSearch]);

	function handleActivationTypeChange(next?: PromotionActivationType) {
		navigate({
			search: (prev) => ({
				...prev,
				activationType: next,
				page: 1,
			}),
		});
	}

	function handlePageChange(next: number) {
		navigate({ search: (prev) => ({ ...prev, page: next }) });
	}

	const query = usePromotions({
		page,
		limit: 10,
		search: urlSearch,
		activationType,
	});

	return {
		inputValue,
		setInputValue,
		query,
		page,
		activationType,
		handleActivationTypeChange,
		handlePageChange,
	};
}
