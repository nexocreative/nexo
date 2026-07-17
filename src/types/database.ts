/**
 * Tipos del modelo de datos de Nexo (esquema `public` de Supabase).
 * La autenticación (users, sessions, accounts) la gestiona el adaptador de
 * NextAuth en el esquema `next_auth`.
 */
import type { CategoryKey } from "@/lib/constants";

export type TransactionType = "expense" | "income";
export type TransactionSource = "manual" | "photo" | "voice" | "recurring" | "chat" | "import";

export interface Profile {
  id: string; // = next_auth.users.id
  display_name: string | null;
  currency: string; // ISO 4217, p.ej. "EUR"
  monthly_budget: number | null; // límite de gasto mensual global
  partner_id: string | null; // usuario vinculado (vista conjunta)
  share_consent: boolean; // consentimiento explícito de compartir
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // siempre positivo; el signo lo da `type`
  category: CategoryKey | null; // null para ingresos
  description: string | null;
  merchant: string | null;
  occurred_at: string; // fecha del movimiento (ISO date)
  source: TransactionSource;
  receipt_url: string | null; // foto del ticket en Storage
  recurring_rule_id: string | null;
  vacation_id: string | null;
  ai_confidence: number | null; // 0..1 si lo categorizó la IA
  created_at: string;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category: CategoryKey;
  monthly_limit: number;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: CategoryKey | null;
  description: string | null;
  day_of_month: number; // 1..28
  active: boolean;
  /** "YYYY-MM" del último mes en que se generó la transacción. */
  last_generated_month: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  owner_id: string;
  partner_id: string | null; // objetivo compartido
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // fecha límite (ISO date)
  created_at: string;
}

export interface SavingsCategory {
  id: string;
  user_id: string;
  name: string;
  monthly_plan: number; // importe planificado a ahorrar cada mes
  sort_order: number;
  created_at: string;
}

export type SavingsEntrySource = "plan" | "manual";

export interface SavingsEntry {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number; // puede ser negativo (retirada/ajuste)
  month: string; // "YYYY-MM"
  source: SavingsEntrySource;
  note: string | null;
  created_at: string;
}

export type VacationStatus = "active" | "closed";

export interface VacationPeriod {
  id: string;
  user_id: string;
  name: string;
  budget: number;
  start_date: string;
  end_date: string | null;
  status: VacationStatus;
  summary: Record<string, unknown> | null; // resumen al cerrar
  created_at: string;
}

export interface AiRecommendation {
  id: string;
  user_id: string;
  month: string; // "YYYY-MM"
  title: string;
  content: string;
  severity: "info" | "warning" | "critical";
  created_at: string;
}

export type PartnerLinkStatus = "pending" | "accepted" | "rejected";

export interface PartnerLink {
  id: string;
  requester_id: string;
  partner_id: string;
  status: PartnerLinkStatus;
  requester_consent: boolean;
  partner_consent: boolean;
  created_at: string;
}

// ─── Grupos (gastos compartidos) ─────────────────────────────────────────────

export type GrupoMiembroStatus = "pending" | "accepted" | "rejected";

export interface Grupo {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface GrupoMiembro {
  id: string;
  grupo_id: string;
  user_id: string;
  invited_by: string;
  status: GrupoMiembroStatus;
  created_at: string;
  // campos enriquecidos en queries
  display_name: string | null;
  email: string | null;
}

export interface GrupoGasto {
  id: string;
  grupo_id: string;
  paid_by: string;
  description: string;
  amount: number;
  occurred_at: string;
  created_at: string;
}

export interface GrupoGastoParte {
  id: string;
  gasto_id: string;
  user_id: string;
  amount: number;
  settled: boolean;
  settled_at: string | null;
}

// Balance neto de un miembro con respecto al usuario actual en un grupo
export interface GrupoBalance {
  user_id: string;
  display_name: string | null;
  email: string | null;
  net: number; // positivo = te deben, negativo = debes
}

// Grupo con todo el detalle necesario para la UI
export interface GrupoConDetalle {
  id: string;
  name: string;
  created_by: string;
  members: GrupoMiembro[];
  gastos: (GrupoGasto & { partes: GrupoGastoParte[]; paid_by_name: string | null })[];
  balances: GrupoBalance[];
}

// Invitación pendiente de responder
export interface GrupoInvite {
  grupo_id: string;
  grupo_name: string;
  invited_by_name: string | null;
  invited_by_email: string | null;
  created_at: string;
}

export interface GruposData {
  grupos: GrupoConDetalle[];
  pendingInvites: GrupoInvite[];
}
