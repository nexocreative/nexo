"use client";

import * as React from "react";
import type { CategoryDef } from "@/lib/constants";

const CategoriesContext = React.createContext<CategoryDef[] | null>(null);

/** Categorías por defecto + personalizadas del usuario, disponibles en todo el dashboard. */
export function CategoriesProvider({
  categories,
  children,
}: {
  categories: CategoryDef[];
  children: React.ReactNode;
}) {
  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoryDef[] {
  const ctx = React.useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories debe usarse dentro de <CategoriesProvider>");
  return ctx;
}
