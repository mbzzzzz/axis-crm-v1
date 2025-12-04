"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AxisLogo } from "@/components/axis-logo";
import { LogOut, Home, FileText, Wrench, FileSignature, User, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TenantHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("tenant_token");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("tenant_email");
    localStorage.removeItem("tenant_name");
    router.push("/tenant-portal/login");
  };

  const navItems = [
    { href: "/tenant-portal/dashboard", label: "Dashboard", icon: Home },
    { href: "/tenant-portal/invoices", label: "Invoices", icon: FileText },
    { href: "/tenant-portal/maintenance", label: "Maintenance", icon: Wrench },
    { href: "/tenant-portal/lease", label: "Lease", icon: FileSignature },
  ];

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/tenant-portal/dashboard" className="flex items-center gap-2">
          <AxisLogo variant="full" size="navbar" />
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <item.icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="size-4" />
                <span className="hidden sm:inline">Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

