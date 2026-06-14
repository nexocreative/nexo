import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
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
  searchParams: { callbackUrl?: string };
}) {
  const session = await getServerAuthSession();
  if (session) {
    redirect(searchParams.callbackUrl || "/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="mb-8 text-2xl font-bold tracking-tight"
      >
        Nexo
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>
            Entra para controlar tus finanzas personales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={searchParams.callbackUrl} />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Al continuar aceptas el tratamiento de tus datos. Cada usuario solo
            ve su propia información.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
