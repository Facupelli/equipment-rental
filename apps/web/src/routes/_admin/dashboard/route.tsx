import type { LocationListResponse } from "@repo/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { ChevronsUpDown, LogOut, User } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useLogout } from "@/features/auth/auth-actions.queries";
import { requireAdminSessionFn } from "@/features/auth/auth-guards.api";
import { locationQueries } from "@/features/tenant/locations/locations.queries";
import { tenantQueries } from "@/features/tenant/tenant.queries";
import { userQueries } from "@/features/user/user.queries";
import { LocationStoreProvider } from "@/shared/contexts/location/location.context";
import {
	useLocationActions,
	useLocationId,
} from "@/shared/contexts/location/location.hooks";

export const Route = createFileRoute("/_admin/dashboard")({
	beforeLoad: async ({ context, location }) => {
		const redirectTo = `${location.pathname}${location.searchStr ?? ""}${location.hash ?? ""}`;

		if (context.tenantContext.face !== "admin") {
			throw redirect({
				to: "/admin/login",
				search: { redirectTo },
			});
		}

		await requireAdminSessionFn({
			data: {
				loginPath: "/admin/login",
				redirectTo,
			},
		});
	},
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData(locationQueries.list()),
			queryClient.ensureQueryData(userQueries.me()),
			queryClient.ensureQueryData(tenantQueries.me()),
		]);
	},
	component: DashboardLayout,
});

type SidebarItem = {
	name: string;
	href?: string;
	children?: Array<{
		name: string;
		href: string;
	}>;
};

const sidebarItems: SidebarItem[] = [
	{ name: "Inicio", href: "/dashboard" },
	{ name: "Cronograma", href: "/dashboard/schedule" },
	// { name: "Orders", href: "/dashboard/orders" },
	{
		name: "Clientes",
		href: "/dashboard/customers",
		children: [
			{
				name: "Altas de cliente",
				href: "/dashboard/customers/pending-profiles",
			},
		],
	},
	{ name: "Categorías", href: "/dashboard/catalog/categories" },
	{
		name: "Productos",
		href: "/dashboard/catalog/products",
		children: [{ name: "Assets", href: "/dashboard/inventory/assets" }],
	},
	{ name: "Combos", href: "/dashboard/catalog/bundles" },
	{ name: "Promociones", href: "/dashboard/promotions" },
	{ name: "Dueños de Equipo", href: "/dashboard/owners" },
	{ name: "Depósitos", href: "/dashboard/locations" },
	{ name: "Ajustes", href: "/dashboard/settings" },
];

function DashboardLayout() {
	const { data: user } = useSuspenseQuery(userQueries.me());
	const { data: tenant } = useSuspenseQuery(tenantQueries.me());
	const { data: locations } = useSuspenseQuery(locationQueries.list());

	return (
		<LocationStoreProvider locations={locations}>
			<div className="grid h-screen grid-cols-[280px_1fr]">
				<aside className="sticky top-0 flex h-svh flex-col border-r border-gray-200 bg-neutral-900 p-4 text-white overflow-y-auto">
					{/* Tenant header */}
					<div>
						<p className="font-bold">{tenant.name}</p>
					</div>

					{/* Location selector */}
					<div className="py-6">
						<LocationSelector locations={locations} />
					</div>

					{/* Nav links */}
					<nav className="flex flex-col gap-y-0.5 overflow-y-auto">
						{sidebarItems.map((item) => (
							<div key={item.name}>
								{item.href ? (
									<Link
										to={item.href}
										className="block rounded-md px-3 py-1.5 text-sm font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
										activeProps={{
											className:
												"block rounded-md px-3 py-1.5 text-sm font-medium bg-white/10 text-white transition-colors",
										}}
										activeOptions={{ exact: true }}
									>
										{item.name}
									</Link>
								) : (
									<p className="px-3 py-1.5 text-sm font-medium text-neutral-400">
										{item.name}
									</p>
								)}

								{item.children ? (
									<div className="ml-3 mt-0.5 border-l border-white/10 pl-3">
										{item.children.map((child) => (
											<Link
												key={child.href}
												to={child.href}
												className="block py-1 text-sm text-neutral-400 transition-colors hover:text-neutral-300"
												activeProps={{
													className:
														"block py-1 text-sm font-medium text-white transition-colors",
												}}
											>
												{child.name}
											</Link>
										))}
									</div>
								) : null}
							</div>
						))}
					</nav>

					{/* Profile popover — pinned to bottom via mt-auto */}
					<div className="mt-auto">
						<UserPopover
							firstName={user.firstName}
							lastName={user.lastName}
							email={user.email}
						/>
					</div>
				</aside>

				<div className="h-full overflow-y-auto bg-gray-50">
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

function UserPopover({
	firstName,
	lastName,
	email,
}: {
	firstName: string;
	lastName: string;
	email: string;
}) {
	const { mutate: logOut } = useLogout();

	return (
		<Popover>
			<PopoverTrigger
				render={
					<button
						type="button"
						className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-neutral-800"
					>
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-600">
							<User className="h-4 w-4 text-neutral-300" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-white">
								{firstName} {lastName}
							</p>
							<p className="truncate text-xs text-neutral-400">{email}</p>
						</div>
						<ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
					</button>
				}
			/>
			<PopoverContent side="top" align="start" className="w-62 p-1">
				<button
					type="button"
					onClick={() => {
						logOut();
					}}
					className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
				>
					<LogOut className="h-4 w-4" />
					Log out
				</button>
			</PopoverContent>
		</Popover>
	);
}
