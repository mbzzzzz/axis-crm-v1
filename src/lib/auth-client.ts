"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, clearSupabaseSession } from "@/lib/supabase/client";
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
let sessionState: Session | null = null;

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

// Global session setter for authClient
let globalSetSession: ((session: Session | null) => void) | null = null;

function setSession(session: Session | null) {
  sessionState = session;
  if (globalSetSession) {
    globalSetSession(session);
  }
}

// Session refresh interval (check every 5 minutes)
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000;
// Refresh session if it expires within 1 hour
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 1000;

export function useSession() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSessionState] = useState<Session | null>(sessionState);
  const [isPending, setIsPending] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  
  // Track user activity
  useActivityTracking();

  // Set global session setter
  useEffect(() => {
    globalSetSession = setSessionState;
    return () => {
      globalSetSession = null;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initialize session with proper cleanup
    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error("Session initialization error:", error);
          // Clear potentially corrupted session
          if (error.message.includes("JWT") || error.message.includes("expired")) {
            clearSupabaseSession();
          }
          setSessionState(null);
          setIsPending(false);
          return;
        }
        
        // Check if user changed (account switch detection)
        const currentUserId = data.session?.user?.id || null;
        if (lastUserIdRef.current && lastUserIdRef.current !== currentUserId && currentUserId) {
          // User switched accounts - clear old session data
          console.log("Account switch detected, clearing old session");
          clearSupabaseSession();
          // Force fresh session check
          const { data: freshData } = await supabase.auth.getSession();
          if (mounted) {
            setSessionState(freshData.session);
            sessionState = freshData.session;
          }
        } else {
          setSessionState(data.session);
          sessionState = data.session;
        }
        
        lastUserIdRef.current = currentUserId;
        setIsPending(false);
        
        // Broadcast session to other tabs
        if (data.session) {
          const channel = getSessionChannel();
          channel.postMessage({ 
            type: "SESSION_UPDATE", 
            session: data.session,
            userId: data.session.user.id 
          });
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        if (mounted) {
          setSessionState(null);
          setIsPending(false);
        }
      }
    };
    
    initializeSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Handle sign out event
      if (event === "SIGNED_OUT") {
        clearSupabaseSession();
        setSessionState(null);
        sessionState = null;
        lastUserIdRef.current = null;
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Check for account switch
        const currentUserId = session?.user?.id || null;
        if (lastUserIdRef.current && lastUserIdRef.current !== currentUserId && currentUserId) {
          // Account switch detected - clear old data
          clearSupabaseSession();
          // Get fresh session
          const { data } = await supabase.auth.getSession();
          if (mounted) {
            setSessionState(data.session);
            sessionState = data.session;
            lastUserIdRef.current = data.session?.user?.id || null;
          }
        } else {
          setSessionState(session);
          sessionState = session;
          lastUserIdRef.current = currentUserId;
        }
      } else {
        setSessionState(session);
        sessionState = session;
        if (session) {
          lastUserIdRef.current = session.user.id;
        }
      }
      
      // Broadcast auth state changes to other tabs
      const channel = getSessionChannel();
      channel.postMessage({ 
        type: "AUTH_STATE_CHANGE", 
        event, 
        session,
        userId: session?.user?.id || null
      });
    });

    // Set up BroadcastChannel listener for cross-tab sync
    const channel = getSessionChannel();
    
    const handleMessage = (event: MessageEvent) => {
      if (!mounted) return;
      
      if (event.data.type === "SESSION_UPDATE" || event.data.type === "AUTH_STATE_CHANGE") {
        // Check if this is a different user (account switch in another tab)
        const incomingUserId = event.data.userId || event.data.session?.user?.id || null;
        const currentUserId = session?.user?.id || null;
        
        if (event.data.event === "SIGNED_OUT") {
          // Clear session on sign out
          clearSupabaseSession();
          setSessionState(null);
          sessionState = null;
          lastUserIdRef.current = null;
        } else if (incomingUserId && incomingUserId !== currentUserId) {
          // Different user logged in another tab - clear and update
          clearSupabaseSession();
          setSessionState(event.data.session);
          sessionState = event.data.session;
          lastUserIdRef.current = incomingUserId;
        } else {
          // Same user or no user - just update session
          setSessionState(event.data.session);
          sessionState = event.data.session;
          if (event.data.session) {
            lastUserIdRef.current = event.data.session.user.id;
          }
        }
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
              setSessionState(refreshedSession);
              sessionState = refreshedSession;
              lastUserIdRef.current = refreshedSession.user.id;
              // Broadcast refreshed session
              channel.postMessage({ 
                type: "SESSION_UPDATE", 
                session: refreshedSession,
                userId: refreshedSession.user.id 
              });
            }
          } else {
            // Session is still valid, just update state
            setSessionState(currentSession);
            sessionState = currentSession;
            if (currentSession) {
              lastUserIdRef.current = currentSession.user.id;
            }
          }
        } else {
          // No session, clear state
          setSessionState(null);
          sessionState = null;
          lastUserIdRef.current = null;
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
          setSessionState(refreshedSession);
          sessionState = refreshedSession;
          lastUserIdRef.current = refreshedSession.user.id;
          const channel = getSessionChannel();
          channel.postMessage({ 
            type: "SESSION_UPDATE", 
            session: refreshedSession,
            userId: refreshedSession.user.id 
          });
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
      setSessionState(data.session);
      sessionState = data.session;
      if (data.session) {
        lastUserIdRef.current = data.session.user.id;
      } else {
        lastUserIdRef.current = null;
      }
      // Broadcast session update
      const channel = getSessionChannel();
      channel.postMessage({ 
        type: "SESSION_UPDATE", 
        session: data.session,
        userId: data.session?.user?.id || null 
      });
    },
  };
}

export const authClient = {
  signOut: async () => {
    const supabase = getSupabaseBrowserClient();
    
    // Sign out from Supabase (this clears server-side session)
    await supabase.auth.signOut();
    
    // Clear all Supabase cookies and localStorage
    if (typeof window !== "undefined") {
      // Clear Supabase session cookies
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes("supabase") || name.includes("auth") || name.startsWith("sb-")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        }
      });
      
      // Clear localStorage items
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.includes("supabase") || key.includes("auth") || key.startsWith("sb-")) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn("Error clearing localStorage:", e);
      }
      
      // Broadcast sign out to other tabs
      const channel = getSessionChannel();
      channel.postMessage({ type: "AUTH_STATE_CHANGE", event: "SIGNED_OUT", session: null });
      
      // Force clear session state
      sessionState = null;
    }
    
    // Redirect to landing page after sign out
    if (typeof window !== "undefined") {
      // Use window.location.replace to prevent back button issues
      window.location.replace("/");
    }
    return { error: null };
  },
};
