import "server-only";
import jwt from "jsonwebtoken";
import { getServerAuthSession } from "@/lib/auth";

/**
 * Resuelve el userId autenticado tanto para la web (sesión de NextAuth vía
 * cookies) como para la app móvil (JWT propio firmado en /api/mobile/login,
 * mandado como "Authorization: Bearer <token>").
 */
export async function requireUserIdFromRequest(req: Request): Promise<string | null> {
  const session = await getServerAuthSession();
  if (session?.user?.id) return session.user.id;

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(auth.slice(7), secret) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
