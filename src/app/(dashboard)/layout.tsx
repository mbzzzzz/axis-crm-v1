"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { CommandPalette } from "@/components/command-palette";
import { CardThemeProvider } from "@/components/card-theme-provider";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      setIsCheckingOnboarding(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const checkOnboarding = async () => {
      try {
        const response = await fetch("/api/preferences", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to fetch onboarding status");
        }
        const data = await response.json();
        if (!data.onboardingCompleted) {
          const destination =
            typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/dashboard";
          router.replace(`/onboarding?next=${encodeURIComponent(destination || "/dashboard")}`);
          return;
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        console.error("Unable to verify onboarding status:", error);
      } finally {
        if (isMounted) {
          setIsCheckingOnboarding(false);
        }
      }
    };

    checkOnboarding();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="size-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 sm:h-16 shrink-0 items-center gap-2 sm:gap-4 border-b bg-background px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4 sm:h-6 hidden sm:block" />
            <div className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0">
              <div className="relative flex-1 max-w-md min-w-0">
                <Search className="absolute left-2 sm:left-3 top-1/2 size-3 sm:size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-7 sm:pl-9 text-sm sm:text-base h-9 sm:h-10"
                  aria-label="Search"
                />
              </div>
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
                <NotificationsDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full hover:opacity-80">
                      <Avatar className="size-8">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session?.user?.email || ""}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await authClient.signOut();
                        // Redirect handled in authClient.signOut
                      }}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background p-3 sm:p-4 md:p-6">
            <CardThemeProvider userId={session?.user?.id || ""}>
              {children}
            </CardThemeProvider>
          </main>
        </SidebarInset>
        <Toaster />
        <CommandPalette open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} />
      </SidebarProvider>
    </div>
  );
}