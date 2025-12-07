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
                    response.cookies.set(cookie.name, cookie.value, {
                        ...cookie.options,
                        // Ensure cookies are cleared by setting extensive past expiration
                        maxAge: 0,
                        expires: new Date(0),
                    });
                });
            },
        },
    });

    await supabase.auth.signOut();

    return response;
}
