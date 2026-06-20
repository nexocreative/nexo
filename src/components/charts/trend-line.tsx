"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PALETTE } from "@/lib/constants";
import { formatEUR, formatAxisEUR } from "@/lib/format";

export function TrendLine({ data }: { data: { month: string; net: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PALETTE.lila} stopOpacity={0.35} />
            <stop offset="100%" stopColor={PALETTE.lila} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" width={56} tickFormatter={formatAxisEUR} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
          formatter={(v: number) => [formatEUR(v), "Balance neto"]}
        />
        <Area type="monotone" dataKey="net" stroke={PALETTE.lila} strokeWidth={2.5} fill="url(#netFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
