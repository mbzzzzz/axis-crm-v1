import { Button } from "@/components/ui/button";
import { Download, CreditCard, PieChart, FileText } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Best Invoicing for Tenants and Realtor | Axis CRM",
    description: "Automate your financial workflow with the best invoicing for tenants and realtor. Recurring billing, expense tracking, and financial reports.",
    keywords: ["best invoicing for tenants and realtor", "real estate invoicing software", "rent collection app", "property management accounting", "realtor commission tracking"],
    openGraph: {
        title: "Best Invoicing for Tenants and Realtor | Axis CRM",
        description: "Simplify rent collection and commission tracking with our advanced invoicing tools.",
    }
};

export default function InvoicingPage() {
    return (
        <div className="bg-black text-white">
            {/* Hero Section */}
            <section className="relative px-6 py-24 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                        Best Invoicing for <span className="text-green-500">Tenants and Realtors</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Stop chasing payments. Axis CRM offers the best specialized invoicing solution designed specifically for the real estate industry.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/register">
                            <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white font-semibold">
                                Start Automating Now
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24 sm:py-32 bg-white/5 mx-auto max-w-7xl px-6 lg:px-8 rounded-3xl mb-12">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-green-400">Financial Freedom</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Get Paid Faster & Manage Commissions
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Our platform handles the complexities of real estate finances so you can focus on closing deals.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <CreditCard className="h-5 w-5 flex-none text-green-400" aria-hidden="true" />
                                Automated Rent Collection
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Set up recurring invoices for tenants. Payments are automatically reconciled and receipts sent.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <FileText className="h-5 w-5 flex-none text-green-400" aria-hidden="true" />
                                Realtor Commission Invoicing
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Easily generate commission invoices for brokerages and agents. Track splits and payouts accurately.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Download className="h-5 w-5 flex-none text-green-400" aria-hidden="true" />
                                One-Click Export
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Tax season is a breeze. Export all your financial data to CSV, PDF, or QuickBooks with a single click.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <PieChart className="h-5 w-5 flex-none text-green-400" aria-hidden="true" />
                                Profit & Loss Reports
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Visual dashboard for your cash flow. See exactly which properties are performing best.</p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative isolate mt-12 px-6 py-24 sm:mt-12 sm:py-32 lg:px-8 text-center">
                <div className="mx-auto max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Streamline your accounting today
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                        Experience the best invoicing for tenants and realtor professionals.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold">
                                Start Free Trial
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
