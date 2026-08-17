import { requireUserId } from "@/lib/data/queries";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getFreeAiTrialRemaining } from "@/lib/billing";
import { AddExpense } from "@/components/dashboard/add-expense";

export default async function AnadirPage() {
  const userId = await requireUserId();

  const [{ data }, aiTrial] = await Promise.all([
    supabaseAdmin()
      .from("transactions")
      .select("category")
      .eq("user_id", userId)
      .eq("type", "income")
      .not("category", "is", null),
    getFreeAiTrialRemaining(userId),
  ]);

  const incomeCategories = Array.from(
    new Set([
      "Salario",
      "Otros",
      ...((data ?? []).map((r) => r.category).filter((c): c is string => !!c)),
    ]),
  );

  return <AddExpense incomeCategories={incomeCategories} aiTrial={aiTrial} />;
}
