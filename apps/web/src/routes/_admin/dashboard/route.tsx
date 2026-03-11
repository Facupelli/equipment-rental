import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentUser } from "@/features/auth/auth.api";
import { ensureValidSession } from "@/features/auth/get-session";
import { createLocationQueryOptions } from "@/features/tenant/locations/locations.queries";
import { getCurrentTenant } from "@/features/tenant/tenant.api";
import { LocationStoreProvider } from "@/shared/contexts/location/location.context";
import {
  useLocationActions,
  useLocationId,
} from "@/shared/contexts/location/location.hooks";
import type { LocationListResponse } from "@repo/schemas";
import {
  createFileRoute,
  getRouteApi,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/dashboard")({
  beforeLoad: async ({ context }) => {
    if (context.tenantContext.face !== "admin") {
      throw redirect({ to: "/admin/login" });
    }

    const { accessToken } = await ensureValidSession({
      data: context.tenantContext.face,
    });
    return { accessToken };
  },
  loader: async ({ context: { queryClient } }) => {
    const [user, tenant] = await Promise.all([
      getCurrentUser(),
      getCurrentTenant(),
    ]);

    if (!user || !tenant) {
      throw Error("User or Tenant not found");
    }

    const locations = await queryClient.ensureQueryData(
      createLocationQueryOptions(),
    );

    return { user, tenant, locations };
  },
  component: DashboardLayout,
});

const authedRoute = getRouteApi("/_admin/dashboard");
const dashboardRoute = getRouteApi("/_admin/dashboard");

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Schedule", href: "/dashboard/schedule" },
  { name: "Orders", href: "/dashboard/orders" },
  { name: "Customers", href: "/dashboard/users" },
  { name: "Categories", href: "/dashboard/catalog/categories" },
  { name: "Products", href: "/dashboard/catalog/products" },
  { name: "Combos", href: "/dashboard/catalog/bundles" },
  { name: "Assets", href: "/dashboard/inventory/assets" },
  { name: "Owners", href: "/dashboard/owners" },
  { name: "Locations", href: "/dashboard/locations" },
  { name: "Settings", href: "/dashboard/settings" },
];

function DashboardLayout() {
  const { user, tenant } = authedRoute.useLoaderData();
  const { locations } = dashboardRoute.useLoaderData();

  return (
    <LocationStoreProvider locations={locations}>
      <div className="grid h-screen grid-cols-[280px_1fr]">
        <aside className="h-full border-r border-gray-200 bg-neutral-900 text-white p-4">
          <div>
            <p className="font-bold">{tenant.name}</p>
            <p>
              Hola {user.firstName} {user.lastName}
            </p>
          </div>

          <div className="py-6">
            <LocationSelector locations={locations} />
          </div>

          <div className="grid gap-y-4">
            {sidebarItems.map((item) => (
              <Link to={item.href} key={item.href}>
                {item.name}
              </Link>
            ))}
          </div>
        </aside>
        <div className="grid h-full grid-rows-[auto_1fr] bg-gray-50">
          <Outlet />
        </div>
      </div>
    </LocationStoreProvider>
  );
}

function LocationSelector({ locations }: { locations: LocationListResponse }) {
  const locationId = useLocationId();
  const { setLocation } = useLocationActions();

  return (
    <Select
      value={locationId ?? ""}
      onValueChange={(value) => value && setLocation(value)}
      items={locations.map((loc) => ({
        label: loc.name,
        value: loc.id,
      }))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a location" />
      </SelectTrigger>
      <SelectContent>
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id}>
            {loc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
