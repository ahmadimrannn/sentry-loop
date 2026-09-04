"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, FileText, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import signOut from "@/app/auth/sign-out/actions";

interface DashboardNavProps {
  userEmail?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      name: "Incidents",
      href: "/dashboard",
      icon: ShieldAlert,
      exact: true,
    },
    {
      name: "Proposals",
      href: "/dashboard/proposals",
      icon: FileText,
      exact: false,
    },
  ];

  const isLinkActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/incidents");
    }
    return pathname.startsWith(item.href);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const NavLinks = () => (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isLinkActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              active
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between h-12 px-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-heading font-bold text-sm tracking-tight">SentryLoop</span>
        </div>
        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
          {userEmail}
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      <Sheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)} title="SentryLoop">
        <div className="flex flex-col justify-between h-[calc(100vh-5rem)]">
          <NavLinks />
          <div className="pt-4 border-t border-border space-y-3">
            {userEmail && (
              <div className="text-xs text-muted-foreground truncate px-1 font-mono">
                {userEmail}
              </div>
            )}
            <Button
              variant="outline"
              size="xs"
              className="w-full justify-start gap-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Desktop Main Layout */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-border bg-neutral-50/50 dark:bg-neutral-900/30 p-4 shrink-0 justify-between">
          <div className="space-y-6">
            {/* Wordmark */}
            <div className="px-2">
              <Link href="/dashboard" className="font-heading font-bold text-base tracking-tight text-foreground">
                SentryLoop
              </Link>
            </div>
            {/* Nav items */}
            <NavLinks />
          </div>

          {/* User & Sign Out */}
          <div className="pt-4 border-t border-border/80 space-y-2.5">
            {userEmail && (
              <div className="text-xs text-muted-foreground truncate px-2 font-mono">
                {userEmail}
              </div>
            )}
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
