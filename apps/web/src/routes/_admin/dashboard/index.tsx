import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
      </header>
      <main className="overflow-y-auto p-6">MAIN DASHBAORD CONTENT</main>
    </>
  );
}
