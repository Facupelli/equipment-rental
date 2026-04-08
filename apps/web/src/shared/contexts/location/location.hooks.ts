import useLocationStore from "./location.context";

export const useLocationId = () =>
	useLocationStore((state) => state.locationId);

export const useLocationActions = () =>
	useLocationStore((state) => state.actions);
