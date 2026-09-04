import { auth } from "@/lib/auth/server";
import { DisclosureBanner } from "@/components/dashboard/DisclosureBanner";
import { DashboardShell } from "@/components/dashboard/DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession();
  const userEmail = session?.user?.email ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DisclosureBanner />
      <DashboardShell userEmail={userEmail}>
        {children}
      </DashboardShell>
    </div>
  );
}
