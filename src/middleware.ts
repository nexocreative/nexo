import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Gate ligero: si no hay cookie de sesión de NextAuth, redirige a /login.
 * La validación real de la sesión se hace en el layout protegido (server
 * component), porque con sesiones de base de datos el cookie es opaco.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken =
    req.cookies.get("next-auth.session-token")?.value ??
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/gastos/:path*",
    "/ingresos/:path*",
    "/objetivos/:path*",
    "/vacaciones/:path*",
    "/ajustes/:path*",
  ],
};
