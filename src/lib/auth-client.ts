"use client";

import { useEffect, useState, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionData =
  | null
  | {
      user: {
        id: string;
        name: string;
        email: string;
        image?: string;
      };
    };

export function useSession() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsPending(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const mappedSession: SessionData = session
    ? {
        user: {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email || "User",
          email: session.user.email ?? "",
          image: session.user.user_metadata.avatar_url || "",
        },
      }
    : null;

  return {
    data: mappedSession,
    isPending,
    error: null,
    refetch: async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    },
  };
}

export const authClient = {
  signOut: async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    return { error: null };
  },
};
