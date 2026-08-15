import "server-only";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isLoginThrottled, recordLoginAttempt } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  // Solo se usa para que Google persista usuarios/cuentas en next_auth.*;
  // las credenciales por email siguen gestionándose a mano en `authorize`.
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Permite enlazar la cuenta de Google a un usuario "fantasma" (creado
      // al invitarlo a un grupo antes de tener cuenta) con el mismo email.
      // Seguro aquí porque Google siempre verifica el email.
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        // Anti-fuerza bruta: bloquea tras varios intentos fallidos seguidos.
        if (await isLoginThrottled(email)) return null;

        const { data: user } = await supabaseAdmin()
          .schema("next_auth")
          .from("users")
          .select("id, name, email, password")
          .eq("email", email)
          .maybeSingle();

        if (!user?.password) {
          await recordLoginAttempt(email, false);
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          await recordLoginAttempt(email, false);
          return null;
        }

        await recordLoginAttempt(email, true);
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Alta con Google: asegura el perfil (public.profiles) igual que hace
      // /api/register para las cuentas por contraseña, y completa el nombre
      // si el usuario era un registro "fantasma" (invitado sin cuenta).
      if (account?.provider === "google" && user.id) {
        const admin = supabaseAdmin();
        const googleName = (profile as { name?: string } | undefined)?.name;

        // allowDangerousEmailAccountLinking enlaza este login de Google a una
        // cuenta next_auth.users ya existente con el mismo email. Si esa cuenta
        // tenía contraseña, alguien pudo haberla creado sin ser la dueña real
        // del email (el registro por contraseña no verifica el email). Google
        // sí verifica el email, así que en cuanto se confirma la propiedad
        // real invalidamos esa contraseña: si era legítima, su dueña sigue
        // entrando con Google; si era de un atacante, deja de servirle.
        await admin
          .schema("next_auth")
          .from("users")
          .update({ password: null })
          .eq("id", user.id)
          .not("password", "is", null);

        if (googleName) {
          await admin
            .schema("next_auth")
            .from("users")
            .update({ name: googleName })
            .eq("id", user.id)
            .is("name", null);
        }

        const { data: existingProfile } = await admin
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const { error } = await admin.from("profiles").insert({
            id: user.id,
            display_name: googleName ?? user.email?.split("@")[0] ?? "Usuario",
            currency: "EUR",
          });
          if (error) console.error("Error creando perfil (Google):", error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      // Firma un JWT con el secreto de Supabase para que RLS funcione con
      // el cliente `supabaseForUser`.
      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      if (signingSecret && session.user && token.id) {
        session.supabaseAccessToken = jwt.sign(
          {
            aud: "authenticated",
            exp: Math.floor(new Date(session.expires).getTime() / 1000),
            sub: token.id as string,
            email: session.user.email,
            role: "authenticated",
          },
          signingSecret,
        );
      }
      return session;
    },
  },
};

/** Obtiene la sesión en Server Components, Server Actions y Route Handlers. */
export function getServerAuthSession() {
  return getServerSession(authOptions);
}
