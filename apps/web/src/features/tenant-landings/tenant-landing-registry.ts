import type { ComponentType } from "react";
import { GuaridaRentalLandingPage } from "./pages/guarida-rental-landing";

export const tenantLandingRegistry: Record<string, ComponentType> = {
  "guarida-rental": GuaridaRentalLandingPage,
  facu2: GuaridaRentalLandingPage,
};
