import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getServerAuthSession } from "@/lib/auth";
import { materializeRecurring, materializeSavingsPlan } from "@/lib/data/queries";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

// Corre una sola vez al día por usuario — no en cada navegación.
function getMaterializeOnce(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return unstable_cache(
    async () => {
      await Promise.all([
        materializeRecurring(userId).catch(() => {}),
        materializeSavingsPlan(userId).catch(() => {}),
      ]);
    },
    [`materialize-${userId}-${today}`],
    { revalidate: 86400 },
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // Contabiliza automáticamente los gastos fijos y el plan de ahorro del mes.
  await getMaterializeOnce(session.user.id)();

  return (
    <div className="nexo-canvas flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Topbar
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
        />
        <main className="flex-1 px-5 pb-10 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
