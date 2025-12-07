import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getAuthenticatedUser() {
  // If Supabase env vars are missing, treat all users as unauthenticated
  // instead of crashing the build. Make sure these are configured in Vercel.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL and anon key must be defined in environment variables. Returning unauthenticated user.");
    return null;
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });

  // First try to get session (this works better with cookies from extensions)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If we have a session, return the user from it
  if (session?.user) {
    return session.user;
  }

  // Fallback to getUser() if no session (for edge cases)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

