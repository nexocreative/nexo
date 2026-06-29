import "server-only";
import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isLoginThrottled, recordLoginAttempt } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
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
