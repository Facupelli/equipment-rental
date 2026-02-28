import {
  createFileRoute,
  getRouteApi,
  Link,
  Outlet,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardLayout,
});

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Bookings", href: "/dashboard/bookings" },
  { name: "Customers", href: "/dashboard/users" },
  { name: "Categories", href: "/dashboard/inventory/categories" },
  { name: "Physical Assets", href: "/dashboard/inventory/items" },
  { name: "Products", href: "/dashboard/inventory/products" },
  { name: "Owners", href: "/dashboard/owners" },
  { name: "Locations", href: "/dashboard/locations" },
];

const authedRoute = getRouteApi("/_authed");

function DashboardLayout() {
  const { user, tenant } = authedRoute.useLoaderData();

  return (
    <div className="grid h-screen grid-cols-[280px_1fr]">
      <aside className="h-full border-r border-gray-200 bg-slate-900 text-white p-4">
        <div>
          <p className="font-bold">{tenant.name}</p>
          <p>
            Hola {user.firstName} {user.lastName}
          </p>
        </div>
        <div className="grid gap-y-4 pt-10">
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
  );
}
