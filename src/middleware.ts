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
          // Ensure cookies are set with proper persistence options
          response.cookies.set(cookie.name, cookie.value, {
            ...cookie.options,
            // Set secure cookie options for persistence
            httpOnly: cookie.options?.httpOnly ?? true,
            sameSite: cookie.options?.sameSite ?? 'lax',
            secure: cookie.options?.secure ?? process.env.NODE_ENV === 'production',
            // Ensure maxAge is set for session persistence (30 days)
            maxAge: cookie.options?.maxAge ?? 60 * 60 * 24 * 30,
            path: cookie.options?.path ?? '/',
          });
        });
      },
    },
  });

  // Get session - Supabase SSR automatically handles cookie persistence
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Allow tenant API routes - they use JWT tokens, not Supabase sessions
  if (isTenantApiRoute(pathname)) {
    return response;
  }

  // Handle tenant portal routes - they use localStorage token (client-side check)
  // Middleware can't access localStorage, so we let it through and check client-side
  if (isTenantRoute(pathname)) {
    return response;
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