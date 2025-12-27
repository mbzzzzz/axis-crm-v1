import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Metadata } from "next";
import { blogPosts } from "@/lib/blog-data";
import { CalendarIcon, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
    title: "Real Estate & Property Management Blog | Axis CRM",
    description: "Expert insights on property management, tenant relations, real estate software, and landlord tips.",
    keywords: ["property management blog", "landlord tips", "real estate software insights", "tenant management guides"],
    openGraph: {
        title: "Axis CRM Blog - Real Estate Insights",
        description: "Stay ahead of the curve with our latest articles on property management technology.",
    }
};

export default function BlogPage() {
    return (
        <div className="bg-black text-white min-h-screen">
            {/* Hero Section */}
            <section className="relative px-6 py-24 sm:py-32 lg:px-8 border-b border-white/10">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                        Insights & <span className="text-blue-500">Resources</span>
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300">
                        Expert advice, industry trends, and practical tips for modern property managers and landlords.
                    </p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="py-16 sm:py-24 mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {blogPosts.map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug}`}>
                            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full flex flex-col overflow-hidden group">
                                {/* Image Placeholder - relying on object-cover for responsive images */}
                                <div className="h-48 w-full overflow-hidden">
                                    <img
                                        src={post.imageUrl}
                                        alt={post.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>

                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">{post.category}</Badge>
                                    </div>
                                    <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors line-clamp-2">{post.title}</CardTitle>
                                </CardHeader>

                                <CardContent className="flex-grow">
                                    <p className="text-gray-400 text-sm line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                </CardContent>

                                <CardFooter className="border-t border-white/5 pt-4 mt-auto text-xs text-gray-500 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {post.readTime}
                                        </span>
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="py-16 px-6">
                <div className="mx-auto max-w-3xl bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8 sm:p-12 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Subscribe to our newsletter</h2>
                    <p className="text-gray-300 mb-8">Get the latest property management tips and software updates delivered straight to your inbox.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex h-10 w-full rounded-md border border-white/20 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                        />
                        <Button>Subscribe</Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
