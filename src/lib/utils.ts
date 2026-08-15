import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanea un `callbackUrl` de login antes de redirigir. Solo permite rutas
 * relativas al propio origen (bloquea `//host`, `https://host` y similares)
 * para evitar un open redirect vía el parámetro de la URL.
 */
export function safeCallbackUrl(url: string | null | undefined, fallback = "/dashboard"): string {
  if (!url) return fallback;
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return fallback;
  return url;
}
