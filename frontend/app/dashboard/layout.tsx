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
  const user = session?.user;
  const userEmail = user?.email ?? null;
  const userImage = (user as { image?: string; avatar?: string; picture?: string })?.image ||
    (user as { image?: string; avatar?: string; picture?: string })?.avatar ||
    (user as { image?: string; avatar?: string; picture?: string })?.picture || null;

  return (
    <div className="min-h-screen flex flex-col bg-background font-inter">
      <DisclosureBanner />
      <DashboardShell userEmail={userEmail} userImage={userImage}>
        {children}
      </DashboardShell>
    </div>
  );
}
