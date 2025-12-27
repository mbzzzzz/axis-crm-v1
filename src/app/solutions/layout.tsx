"use client";

import { AxisLogo } from "@/components/axis-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SolutionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" aria-label="Home">
                        <AxisLogo variant="full" size="navbar" className="text-white" />
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/solutions/tenant-management"
                            className={cn("text-sm font-medium transition-colors hover:text-blue-400", pathname.includes("tenant") ? "text-blue-400" : "text-white/80")}
                        >
                            Tenant Management
                        </Link>
                        <Link
                            href="/solutions/invoicing"
                            className={cn("text-sm font-medium transition-colors hover:text-blue-400", pathname.includes("invoicing") ? "text-blue-400" : "text-white/80")}
                        >
                            Invoicing
                        </Link>
                        <Link
                            href="/solutions/list-your-property"
                            className={cn("text-sm font-medium transition-colors hover:text-blue-400", pathname.includes("list") ? "text-blue-400" : "text-white/80")}
                        >
                            List Property
                        </Link>
                        <Link
                            href="/blog"
                            className={cn("text-sm font-medium transition-colors hover:text-blue-400", pathname.includes("blog") ? "text-blue-400" : "text-white/80")}
                        >
                            Blog
                        </Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/listings">
                            <Button variant="ghost" className="text-white hover:bg-white/10 hidden sm:inline-flex">
                                Find Properties
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="ghost" className="text-white hover:bg-white/10">
                                Sign in
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-white text-black hover:bg-white/90 font-semibold">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="space-y-4">
                            <AxisLogo variant="full" className="text-white" />
                            <p className="text-sm text-gray-400">
                                The ultimate real estate management tool and property listing solution.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Solutions</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/solutions/tenant-management" className="hover:text-white">Tenant Management</Link></li>
                                <li><Link href="/solutions/invoicing" className="hover:text-white">Invoicing for Realtors</Link></li>
                                <li><Link href="/solutions/list-your-property" className="hover:text-white">List Your Property</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Platform</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/listings" className="hover:text-white">Browse Listings</Link></li>
                                <li><Link href="/register" className="hover:text-white">Sign Up</Link></li>
                                <li><Link href="/login" className="hover:text-white">Login</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                                <li><Link href="/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; {new Date().getFullYear()} Axis CRM. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
