"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActivityTracking } from "@/lib/session-activity";

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

// BroadcastChannel for cross-tab session sync
let sessionChannel: BroadcastChannel | null = null;

function getSessionChannel(): BroadcastChannel {
  if (typeof window === "undefined") {
    // Server-side: return a dummy object
    return {} as BroadcastChannel;
  }
  if (!sessionChannel) {
    sessionChannel = new BroadcastChannel("axis-crm-session-sync");
  }
  return sessionChannel;
}

// Session refresh interval (check every 5 minutes)
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000;
// Refresh session if it expires within 1 hour
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 1000;

export function useSession() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track user activity
  useActivityTracking();

  useEffect(() => {
    let mounted = true;

    // Initialize session
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsPending(false);
      
      // Broadcast session to other tabs
      if (data.session) {
        const channel = getSessionChannel();
        channel.postMessage({ type: "SESSION_UPDATE", session: data.session });
      }
    });

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      
      // Broadcast auth state changes to other tabs
      const channel = getSessionChannel();
      channel.postMessage({ type: "AUTH_STATE_CHANGE", event, session });
    });

    // Set up BroadcastChannel listener for cross-tab sync
    const channel = getSessionChannel();
    
    const handleMessage = (event: MessageEvent) => {
      if (!mounted) return;
      
      if (event.data.type === "SESSION_UPDATE" || event.data.type === "AUTH_STATE_CHANGE") {
        // Update session from other tab
        setSession(event.data.session);
      }
    };
    
    channel.addEventListener("message", handleMessage);

    // Set up automatic session refresh
    const refreshSession = async () => {
      if (!mounted) return;
      
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (currentSession) {
          // Check if session is about to expire
          const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : null;
          const now = Date.now();
          
          if (expiresAt && expiresAt - now < SESSION_REFRESH_THRESHOLD) {
            // Refresh the session before it expires
            const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
            
            if (!mounted) return;
            
            if (error) {
              console.error("Session refresh error:", error);
              // If refresh fails, try to get session again
              const { data } = await supabase.auth.getSession();
              if (!mounted) return;
              setSession(data.session);
            } else if (refreshedSession) {
              setSession(refreshedSession);
              // Broadcast refreshed session
              channel.postMessage({ type: "SESSION_UPDATE", session: refreshedSession });
            }
          } else {
            // Session is still valid, just update state
            setSession(currentSession);
          }
        } else {
          // No session, clear state
          setSession(null);
        }
      } catch (error) {
        console.error("Error refreshing session:", error);
      }
    };

    // Refresh session periodically
    refreshTimerRef.current = setInterval(refreshSession, SESSION_REFRESH_INTERVAL);
    
    // Also refresh on visibility change (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      channel.removeEventListener("message", handleMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
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

  const extendSession = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        if (!error && refreshedSession) {
          setSession(refreshedSession);
          const channel = getSessionChannel();
          channel.postMessage({ type: "SESSION_UPDATE", session: refreshedSession });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error extending session:", error);
      return false;
    }
  };

  return {
    data: mappedSession,
    isPending,
    error: null,
    session, // Expose raw session for timeout warning
    extendSession,
    refetch: async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      // Broadcast session update
      const channel = getSessionChannel();
      channel.postMessage({ type: "SESSION_UPDATE", session: data.session });
    },
  };
}

export const authClient = {
  signOut: async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    
    // Broadcast sign out to other tabs
    if (typeof window !== "undefined") {
      const channel = getSessionChannel();
      channel.postMessage({ type: "AUTH_STATE_CHANGE", event: "SIGNED_OUT", session: null });
    }
    
    // Redirect to landing page after sign out
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return { error: null };
  },
};
