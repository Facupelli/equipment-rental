function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatUpcomingDate(dateStr: string): { label: string; sub: string } {
  const today = new Date();
  const date = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round(
    (date.getTime() - new Date(today.toDateString()).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const sub = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (diffDays === 1) return { label: "Tomorrow", sub };

  const label = date.toLocaleDateString("en-US", { weekday: "short" });
  return { label: `${label}, ${sub}`, sub: "" };
}
