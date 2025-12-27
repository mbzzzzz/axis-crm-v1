import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Shield, Clock } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Best Property Tenant Management Tool | Axis CRM",
    description: "Streamline your rental business with the best property tenant management tool. Handle screening, leases, maintenance, and communication in one place.",
    keywords: ["best property tenant management tool", "tenant screening software", "lease management", "landlord tenant portal", "rental management system"],
    openGraph: {
        title: "Best Property Tenant Management Tool | Axis CRM",
        description: "The ultimate solution for managing tenants efficiently. Automate your workflow today.",
    }
};

export default function TenantManagementPage() {
    return (
        <div className="bg-black text-white">
            {/* Hero Section */}
            <section className="relative px-6 py-24 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                        The Best Property <span className="text-blue-500">Tenant Management Tool</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Effortlessly manage your tenants from application to move-out. Axis CRM provides the most comprehensive toolkit for modern landlords and property managers.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/register">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                                Start Free Trial
                            </Button>
                        </Link>
                        <Link href="/features">
                            <Button variant="ghost" className="text-sm font-semibold leading-6 text-white">
                                Learn more <span aria-hidden="true">→</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24 sm:py-32 bg-white/5 mx-auto max-w-7xl px-6 lg:px-8 rounded-3xl mb-12">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-blue-400">Everything you need</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Complete Tenant Lifecycle Management
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Stop juggling spreadsheets and emails. Our platform centralizes every interaction with your tenants.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Shield className="h-5 w-5 flex-none text-blue-400" aria-hidden="true" />
                                Comprehensive Screening
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Run detailed background, credit, and eviction checks instantly. Find the perfect tenant with confidence.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Users className="h-5 w-5 flex-none text-blue-400" aria-hidden="true" />
                                Tenant Portal
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Give tenants a dedicated app to pay rent, submit maintenance requests, and view lease documents.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Clock className="h-5 w-5 flex-none text-blue-400" aria-hidden="true" />
                                Lease Tracking
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Never miss a renewal. Automated alerts for lease expirations and rent increases ensure maximum occupancy.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <CheckCircle2 className="h-5 w-5 flex-none text-blue-400" aria-hidden="true" />
                                Maintenance Requests
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Streamlined ticket system. Tenants report issues, you assign vendors, and track progress realtime.</p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative isolate mt-12 px-6 py-24 sm:mt-12 sm:py-32 lg:px-8 text-center">
                <div className="mx-auto max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to upgrade your property management?
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                        Join thousands of landlords who use Axis CRM as their best property tenant management tool.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold">
                                Get Started for Free
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
