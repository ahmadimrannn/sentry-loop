"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
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
import { navItems } from "@/constants";

export function DashboardShell({ userEmail, userName, userImage, children }: DashboardNavProps) {
    const pathname = usePathname();

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
                        href="/"
                        className="flex items-center font-geist text-base tracking-tight text-sidebar-foreground"
                    >
                        <Image
                            src="/logo_header.png"
                            alt="SentryLoop Logo"
                            width={30}
                            height={30}
                            className="object-contain"
                        />
                        <span>SentryLoop</span>
                    </Link>
                </SidebarHeader>

                {/* Navigation Items */}
                <SidebarContent className="p-2 py-6">
                    <SidebarMenu>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isLinkActive(item);
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        render={
                                            <Link href={item.href} className="flex items-center gap-2.5 font-inter text-[18px] py-6 mb-2">
                                                <Icon className="size-6 shrink-0" />
                                                <span>{item.name}</span>
                                            </Link>
                                        }
                                        isActive={active}
                                        className={
                                            active
                                                ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold font-geist"
                                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground font-geist"
                                        }
                                    />
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>

                {/* Footer User Avatar, User Name, User Email & Sign Out */}
                <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
                    {(userImage || userName || userEmail) && (
                        <div className="flex items-center gap-1.5 px-1 overflow-hidden">
                            {userImage && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={userImage}
                                    alt={userName || "User Avatar"}
                                    className="size-11 rounded-full object-cover border border-sidebar-border shrink-0"
                                />
                            )}
                            <div className="flex flex-col min-w-0">
                                {userName && (
                                    <span className="font-geist text-sm font-semibold tracking-tight text-sidebar-foreground truncate capitalize">
                                        {userName}
                                    </span>
                                )}
                                {userEmail && (
                                    <span className="text-[11px] text-sidebar-foreground/70 truncate font-mono">
                                        {userEmail}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    <Button
                        variant="destructive"
                        size="sm"
                        className="justify-start px-4 py-5 text-md text-sidebar-foreground/70 hover:text-sidebar hover:bg-red-400 cursor-pointer font-inter"
                        onClick={handleSignOut}
                    >
                        <LogOut className="size-4" />
                        Sign Out
                    </Button>
                </SidebarFooter>
            </Sidebar>

            {/* Main Content Inset */}
            <SidebarInset className="flex flex-col min-w-0 flex-1 bg-background">
                {/* Top bar trigger for mobile viewports */}
                <header className="flex h-12 items-center justify-between border-b border-border px-4 md:hidden">
                    <div className="flex items-center gap-2.5">
                        <SidebarTrigger />
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo_header.png"
                                alt="SentryLoop Logo"
                                width={20}
                                height={20}
                                className="size-5 object-contain"
                            />
                            <span className="font-geist text-md tracking-tight">SentryLoop</span>
                        </Link>
                    </div>
                    {userImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={userImage}
                            alt={userName || "User Avatar"}
                            className="size-10 rounded-full object-cover border border-sidebar-border shrink-0"
                        />
                    ) : (userName || userEmail) && (
                        <div className="text-xs text-muted-foreground truncate max-w-30 font-mono">
                            {userName || userEmail}
                        </div>
                    )}
                </header>

                <main className="flex-1 p-4 md:p-6 min-w-0 font-inter">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
