"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Selector de fecha propio (Popover + react-day-picker) en vez del <input
 * type="date"> nativo del navegador: mismo valor "YYYY-MM-DD" que antes, pero
 * se abre al pulsar en cualquier parte del campo (no solo el icono, como
 * pasa con el nativo) y tiene un calendario con estilo propio en español.
 */
export function DatePicker({
  id,
  value,
  onChange,
  className,
  placeholder = "Selecciona una fecha",
  formatStr = "d 'de' MMMM 'de' yyyy",
  showIcon = true,
  clearable = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Texto cuando no hay fecha elegida. */
  placeholder?: string;
  /** Formato de date-fns para mostrar la fecha elegida (por defecto, largo en español). */
  formatStr?: string;
  /** Oculta el icono de calendario del trigger, para contextos muy estrechos (celdas de tabla). */
  showIcon?: boolean;
  /** Añade un botón "Quitar fecha" en el calendario, para campos opcionales. */
  clearable?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseISO(value) : undefined;
  const valid = !!selected && isValid(selected);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm outline-none transition-colors hover:border-primary/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
            className,
          )}
        >
          {showIcon && <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className={cn("truncate", !valid && "text-muted-foreground")}>
            {valid ? format(selected as Date, formatStr, { locale: es }) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={valid ? selected : undefined}
          onSelect={(d) => {
            if (!d) return;
            onChange(format(d, "yyyy-MM-dd"));
            setOpen(false);
          }}
          locale={es}
          initialFocus
          captionLayout="dropdown-buttons"
          fromYear={new Date().getFullYear() - 20}
          toYear={new Date().getFullYear() + 1}
        />
        {clearable && valid && (
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="w-full rounded-md px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Quitar fecha
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
