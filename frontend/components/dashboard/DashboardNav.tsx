"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldAlert, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import signOut from "@/app/auth/sign-out/actions";

interface DashboardNavProps {
  userEmail?: string | null;
  userImage?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userEmail, userImage, children }: DashboardNavProps) {
  const pathname = usePathname();

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

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        {/* Header Wordmark & Logo */}
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-geist font-semibold text-base tracking-tight text-sidebar-foreground"
          >
            <Image
              src="/logo_header.png"
              alt="SentryLoop Logo"
              width={24}
              height={24}
              className="size-6 object-contain"
            />
            <span>SentryLoop</span>
          </Link>
        </SidebarHeader>

        {/* Navigation Items */}
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={
                      <Link href={item.href} className="flex items-center gap-2.5 font-inter">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    }
                    isActive={active}
                    className={
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold font-inter"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground font-inter"
                    }
                  />
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer User Avatar, User Email & Sign Out */}
        <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
          {userImage && (
            <div className="px-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={userImage}
                alt="User Avatar"
                className="size-9 rounded-full object-cover border border-sidebar-border shadow-2xs"
              />
            </div>
          )}
          {userEmail && (
            <div className="text-xs text-sidebar-foreground/70 truncate px-1 font-mono">
              {userEmail}
            </div>
          )}
          <Button
            variant="ghost"
            size="xs"
            className="w-full justify-start gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent font-inter"
            onClick={handleSignOut}
          >
            <LogOut className="size-3.5" />
            Sign Out
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Inset */}
      <SidebarInset className="flex flex-col min-w-0 flex-1 bg-background">
        {/* Top bar trigger for mobile viewports */}
        <header className="flex h-12 items-center gap-2.5 border-b border-border px-4 md:hidden">
          <SidebarTrigger />
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo_header.png"
              alt="SentryLoop Logo"
              width={20}
              height={20}
              className="size-5 object-contain"
            />
            <span className="font-geist font-semibold text-sm tracking-tight">SentryLoop</span>
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 min-w-0 font-inter">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
