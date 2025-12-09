import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/auth/callback",
  "/api/webhooks",
  "/api/auth",
  "/api/auth/session-check", // Allow extension to check session status
  "/api/public", // Public API endpoints (property listings)
  "/properties", // Public property browse pages
  "/tenant-portal/login",
  "/tenant-portal/register",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isTenantRoute(pathname: string) {
  return pathname.startsWith("/tenant-portal");
}

function isTenantApiRoute(pathname: string) {
  // Allow tenant-specific API routes (they use JWT tokens, not Supabase sessions)
  return pathname.startsWith("/api/maintenance/generate-description/tenant") ||
         pathname.startsWith("/api/maintenance/mobile") ||
         pathname.startsWith("/api/invoices/mobile") ||
         pathname.startsWith("/api/auth/tenant");
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables in middleware");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () =>
        request.cookies.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        })),
      setAll: (cookies) => {
        cookies.forEach((cookie) => {
          // Use Supabase's options exactly as provided - don't override
          // This ensures consistency with how Supabase manages sessions
          response.cookies.set(cookie.name, cookie.value, cookie.options || {});
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  // Allow public routes (check before session to avoid unnecessary work)
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Allow tenant API routes - they use JWT tokens, not Supabase sessions
  if (isTenantApiRoute(pathname)) {
    return response;
  }

  // Allow auth endpoints - they handle their own authentication
  if (pathname === "/api/auth/session-check" || pathname === "/api/auth/extension-token") {
    return response;
  }

  // Handle tenant portal routes - they use localStorage token (client-side check)
  // Middleware can't access localStorage, so we let it through and check client-side
  if (isTenantRoute(pathname)) {
    return response;
  }

  // Get session - Supabase SSR automatically handles cookie persistence
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Log session errors for debugging (but don't fail the request)
  if (sessionError) {
    console.error(`Middleware session error for ${pathname}:`, sessionError);
    
    // If session error indicates expired/invalid token, try to refresh
    if (sessionError.message.includes("JWT") || sessionError.message.includes("expired")) {
      // Try to refresh the session
      try {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession) {
          // Session refreshed, continue with refreshed session
          return response;
        }
      } catch (refreshError) {
        // Refresh failed, will redirect to login below
        console.error("Session refresh failed:", refreshError);
      }
    }
  }

  // Debug logging for auth flow
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const authCookies = request.cookies.getAll().filter(c => 
      c.name.includes('auth') || c.name.includes('supabase')
    );
    if (authCookies.length > 0 && !session) {
      console.log(`Middleware: Found ${authCookies.length} auth cookies but no session for ${pathname}`);
      console.log(`Cookie names:`, authCookies.map(c => c.name).join(', '));
    } else if (session) {
      console.log(`Middleware: Session found for ${pathname}, user: ${session.user.id}`);
    }
  }

  // For agent routes, require Supabase session
  if (!session) {
    // For API routes, return JSON 401 instead of redirecting (prevents HTML responses)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    
    // For page routes, redirect to login
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    redirectUrl.searchParams.set("role", "agent");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};