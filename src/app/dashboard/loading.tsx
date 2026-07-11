export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-muted" />
      <div className="h-48 rounded-3xl bg-muted" />
    </div>
  );
}
