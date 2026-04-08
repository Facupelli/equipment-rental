import { createStore, useStore, type StoreApi } from "zustand";
import React from "react";
import type { LocationListResponse } from "@repo/schemas";
import { LOCATION_STORAGE_KEY, type LocationStore } from "./location.types";

const LocationStoreContext =
	React.createContext<StoreApi<LocationStore> | null>(null);

type LocationStoreProviderProps = {
	locations: LocationListResponse;
	children: React.ReactNode;
};

export function LocationStoreProvider({
	locations,
	children,
}: LocationStoreProviderProps) {
	const [store] = React.useState(() => {
		const persisted =
			typeof window !== "undefined"
				? localStorage.getItem(LOCATION_STORAGE_KEY)
				: null;

		const isValid =
			persisted !== null && locations.some((loc) => loc.id === persisted);

		const initialLocationId = isValid ? persisted : (locations[0]?.id ?? null);

		return createStore<LocationStore>((set) => ({
			locationId: initialLocationId,
			actions: {
				setLocation: (id: string) => {
					localStorage.setItem(LOCATION_STORAGE_KEY, id);
					set({ locationId: id });
				},
			},
		}));
	});

	return (
		<LocationStoreContext.Provider value={store}>
			{children}
		</LocationStoreContext.Provider>
	);
}

function useLocationStore<T>(selector: (state: LocationStore) => T): T {
	const store = React.useContext(LocationStoreContext);
	if (!store) {
		throw new Error(
			"useLocationStore must be used within a LocationStoreProvider",
		);
	}
	return useStore(store, selector);
}

export default useLocationStore;
