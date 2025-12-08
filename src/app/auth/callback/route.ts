import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Always redirect to dashboard after successful Google auth (never to landing page)
  // Only use redirectedFrom if it's a valid dashboard route (not landing page or "/")
  const redirectedFrom = requestUrl.searchParams.get("redirectedFrom");
  let redirectTo = "/dashboard";
  
  // Only use redirectedFrom if it's a valid dashboard route (not landing page)
  if (redirectedFrom && 
      redirectedFrom !== "/" && 
      !redirectedFrom.startsWith("/?") &&
      (redirectedFrom.startsWith("/dashboard") || redirectedFrom.startsWith("/properties") || 
       redirectedFrom.startsWith("/tenants") || redirectedFrom.startsWith("/invoices") ||
       redirectedFrom.startsWith("/maintenance") || redirectedFrom.startsWith("/leads") ||
       redirectedFrom.startsWith("/financials") || redirectedFrom.startsWith("/settings"))) {
    redirectTo = redirectedFrom;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in auth callback");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (code) {
    // Create a response that will be used for redirect
    // We'll create the actual redirect after session exchange
    let redirectResponse: NextResponse | null = null;
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () =>
          request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          })),
        setAll: (cookies) => {
          // Create redirect response on first cookie set
          if (!redirectResponse) {
            redirectResponse = NextResponse.redirect(new URL(redirectTo, request.url));
          }
          
          cookies.forEach((cookie) => {
            // Ensure cookies are set with proper persistence options for session
            if (redirectResponse) {
              redirectResponse.cookies.set(cookie.name, cookie.value, {
                ...cookie.options,
                httpOnly: cookie.options?.httpOnly ?? true,
                sameSite: cookie.options?.sameSite ?? 'lax',
                secure: cookie.options?.secure ?? (process.env.NODE_ENV === 'production'),
                maxAge: cookie.options?.maxAge ?? 60 * 60 * 24 * 30,
                path: cookie.options?.path ?? '/',
              });
            }
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

    // Return the redirect response with cookies set
    // If for some reason redirectResponse wasn't created, create it now
    if (!redirectResponse) {
      redirectResponse = NextResponse.redirect(new URL(redirectTo, request.url));
    }
    
    return redirectResponse;
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

