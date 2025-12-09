import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const response = NextResponse.redirect(new URL("/login", request.url));

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll: () =>
                request.cookies.getAll().map((cookie) => ({
                    name: cookie.name,
                    value: cookie.value,
                })),
            setAll: (cookies) => {
                cookies.forEach((cookie) => {
                    // Clear all Supabase auth cookies
                    response.cookies.set(cookie.name, "", {
                        ...cookie.options,
                        maxAge: 0,
                        expires: new Date(0),
                        path: "/",
                    });
                });
            },
        },
    });

    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Also clear any Supabase-related cookies manually
    const allCookies = request.cookies.getAll();
    allCookies.forEach((cookie) => {
        if (cookie.name.includes("supabase") || cookie.name.includes("auth") || cookie.name.startsWith("sb-")) {
            response.cookies.set(cookie.name, "", {
                maxAge: 0,
                expires: new Date(0),
                path: "/",
            });
        }
    });

    return response;
}
