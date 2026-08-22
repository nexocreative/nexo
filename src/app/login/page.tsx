import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/utils";
import { LoginForm } from "./login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; tab?: string; email?: string; error?: string };
}) {
  const session = await getServerAuthSession();
  if (session) {
    redirect(safeCallbackUrl(searchParams.callbackUrl));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nexo.svg" alt="Nexo" width={132} height={43} className="h-auto w-[132px]" />
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Entra para controlar tus finanzas personales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            callbackUrl={searchParams.callbackUrl}
            defaultTab={searchParams.tab === "register" ? "register" : "login"}
            defaultEmail={searchParams.email}
            authError={searchParams.error}
          />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Al continuar aceptas los{" "}
            <Link href="/terminos" className="underline underline-offset-2 hover:text-foreground">
              Términos y condiciones
            </Link>{" "}
            y nuestra{" "}
            <Link href="/privacidad" className="underline underline-offset-2 hover:text-foreground">
              Política de privacidad
            </Link>
            . Cada usuario solo ve su propia información.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
