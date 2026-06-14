import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-sidebar px-5 py-6 lg:block">
      <SidebarNav />
    </aside>
  );
}
