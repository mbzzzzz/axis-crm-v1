import { Button } from "@/components/ui/button";
import { Camera, Globe, TrendingUp, Search } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Buy Property, Rent Property, Property Listing Services | Axis CRM",
    description: "The ultimate platform to buy property, rent property, and manage property listings. Reach millions of potential buyers and tenants.",
    keywords: ["buy property", "rent property", "property listing", "real estate marketplace", "sell my home", "list rental property"],
    openGraph: {
        title: "Buy & Rent Property - Premier Listing Platform | Axis CRM",
        description: "Connect with buyers and renters instantly. List your property on Axis CRM.",
    }
};

export default function ListPropertyPage() {
    return (
        <div className="bg-black text-white">
            {/* Hero Section */}
            <section className="relative px-6 py-24 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                        Buy Property, Rent Property & <span className="text-purple-500">List with Confidence</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Whether you want to buy property, rent property, or manage a portfolio, Axis CRM puts your property listing in front of the right audience.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/listings">
                            <Button size="lg" variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-950 font-semibold">
                                Browse Listings
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="lg" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold">
                                List Your Property
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-24 sm:py-32 bg-white/5 mx-auto max-w-7xl px-6 lg:px-8 rounded-3xl mb-12">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-purple-400">Maximize Exposure</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Your Property Listing Deserves the Best
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        We use advanced AI and marketing tools to ensure your property sells or rents faster.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Globe className="h-5 w-5 flex-none text-purple-400" aria-hidden="true" />
                                Global Reach
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Your listings are syndicated to top real estate networks. Reach buyers looking to buy property locally and internationally.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Camera className="h-5 w-5 flex-none text-purple-400" aria-hidden="true" />
                                Stunning Galleries
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Showcase high-resolution images, virtual tours, and floor plans. Make tenants want to rent property from you instantly.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <TrendingUp className="h-5 w-5 flex-none text-purple-400" aria-hidden="true" />
                                Smart Pricing
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Use our AI valuation tools to set the perfect price. Maximize ROI whether you sell or rent.</p>
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                                <Search className="h-5 w-5 flex-none text-purple-400" aria-hidden="true" />
                                SEO Optimized
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                                <p className="flex-auto">Every property listing is optimized for search engines, ensuring you rank high for "buy property" and "rent property" searches.</p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative isolate mt-12 px-6 py-24 sm:mt-12 sm:py-32 lg:px-8 text-center">
                <div className="mx-auto max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Start listing today
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
                        Join the fastest growing network for property owners and agents.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold">
                                Add Your Listing
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
