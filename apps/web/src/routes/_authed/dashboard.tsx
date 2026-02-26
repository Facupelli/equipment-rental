import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardComponent,
});

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Bookings", href: "/dashboard/bookings" },
  { name: "Customers", href: "/dashboard/users" },
  { name: "Categories", href: "/dashboard/categories" },
  { name: "Products", href: "/dashboard/products" },
];

function DashboardComponent() {
  const { user, tenant } = Route.useRouteContext();

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
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          </div>

          <nav className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome back</span>
            <div className="h-8 w-8 rounded-full bg-gray-300" />
          </nav>
        </header>

        <main className="overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
