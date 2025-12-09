import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  
  // Handle OAuth errors
  if (error) {
    console.error("OAuth error in callback:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
  
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
    // Create redirect response FIRST - this ensures we have a response object
    // to attach cookies to during the session exchange
    const redirectResponse = NextResponse.redirect(new URL(redirectTo, request.url));
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () =>
          request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          })),
        setAll: (cookies) => {
          // Set all cookies on the redirect response
          // Use Supabase's options exactly as provided - don't override
          cookies.forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie.options || {});
          });
        },
      },
    });

    // Exchange code for session - this will call setAll to set cookies
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

    // Log successful auth for debugging
    console.log("Auth callback successful - redirecting to:", redirectTo);
    console.log("Session user ID:", session.user.id);
    
    // Set a flag in the response headers to prevent landing page redirect
    redirectResponse.headers.set('X-Auth-Callback', 'true');
    
    // Return redirect response with cookies already set
    return redirectResponse;
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

