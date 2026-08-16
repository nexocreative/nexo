"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

const STORAGE_KEY = "nexo-sidebar-collapsed";

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 overflow-y-auto border-r border-border/60 bg-sidebar px-5 py-6 transition-[width] duration-200 lg:block",
        collapsed ? "w-[76px] px-3" : "w-64",
      )}
    >
      <SidebarNav collapsed={collapsed} onToggleCollapsed={toggle} />
    </aside>
  );
}
