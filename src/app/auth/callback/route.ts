import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Always redirect to dashboard (never to landing page)
  // If redirectedFrom is "/" or landing page, ignore it and go to dashboard
  const redirectedFrom = requestUrl.searchParams.get("redirectedFrom");
  let redirectTo = "/dashboard";
  
  // Only use redirectedFrom if it's a valid dashboard route (not landing page)
  if (redirectedFrom && redirectedFrom !== "/" && !redirectedFrom.startsWith("/?")) {
    redirectTo = redirectedFrom;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in auth callback");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (code) {
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () =>
          request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          })),
        setAll: (cookies) => {
          cookies.forEach((cookie) => {
            // Ensure cookies are set with proper persistence options for session
            response.cookies.set(cookie.name, cookie.value, {
              ...cookie.options,
              httpOnly: cookie.options?.httpOnly ?? true,
              sameSite: cookie.options?.sameSite ?? 'lax',
              secure: cookie.options?.secure ?? (process.env.NODE_ENV === 'production'),
              // Set maxAge for session persistence (30 days)
              maxAge: cookie.options?.maxAge ?? 60 * 60 * 24 * 30,
              path: cookie.options?.path ?? '/',
              // Ensure domain is set correctly for cookie persistence
              domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
            });
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
    }

    // Verify session was created before redirecting
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("Session not created after code exchange");
      return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
    }

    return response;
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

