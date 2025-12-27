import { getPostBySlug, blogPosts } from "@/lib/blog-data";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { AxisLogo } from "@/components/axis-logo";
import { Badge } from "@/components/ui/badge";

interface PageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const post = getPostBySlug(params.slug);

    if (!post) {
        return {
            title: "Post Not Found | Axis CRM Blog",
        };
    }

    return {
        title: `${post.title} | Axis CRM Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: [post.imageUrl],
            type: "article",
        },
    };
}

export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }));
}

export default function BlogPostPage({ params }: PageProps) {
    const post = getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Simple Header for Blog Post */}
            <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" aria-label="Home">
                        <AxisLogo variant="full" size="navbar" className="text-white" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/blog">
                            <Button variant="ghost" className="text-white hover:bg-white/10 gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to Blog
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <article className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl">
                <div className="mb-8">
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 mb-4">{post.category}</Badge>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-b border-white/10 pb-8">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {post.author}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {post.date}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {post.readTime}
                        </div>
                    </div>
                </div>

                <div className="relative w-full h-[400px] mb-12 rounded-xl overflow-hidden">
                    <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                <div
                    className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-ul:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Post Footer / CTA */}
                <div className="mt-16 pt-8 border-t border-white/10 bg-white/5 rounded-2xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Ready to streamline your workflow?</h3>
                    <p className="text-gray-300 mb-6">Join thousands of property managers using Axis CRM today.</p>
                    <div className="flex justify-center gap-4">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold">Start Free Trial</Button>
                        </Link>
                        <Link href="/listings">
                            <Button size="lg" variant="outline" className="border-white/30 hover:bg-white/10">Browse Listings</Button>
                        </Link>
                    </div>
                </div>
            </article>

            {/* Footer code repeated or imported - simplified for this page */}
            <footer className="border-t border-white/10 bg-black py-8 mt-12">
                <div className="container mx-auto px-4 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Axis CRM. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
