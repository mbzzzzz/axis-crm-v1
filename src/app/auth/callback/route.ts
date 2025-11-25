import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectedFrom") || "/dashboard";
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in auth callback");
    return response;
  }

  if (code) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () =>
          request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          })),
        setAll: (cookies) => {
          cookies.forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          });
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}

