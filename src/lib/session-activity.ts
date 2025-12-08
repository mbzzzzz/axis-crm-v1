"use client";

import { useEffect } from "react";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute

let lastActivityTime = Date.now();
let activityListeners: Set<() => void> = new Set();

// Track user activity
export function trackUserActivity() {
  lastActivityTime = Date.now();
  // Notify all listeners
  activityListeners.forEach((listener) => listener());
}

// Get time since last activity
export function getTimeSinceLastActivity(): number {
  return Date.now() - lastActivityTime;
}

// Check if user is idle
export function isUserIdle(): boolean {
  return getTimeSinceLastActivity() > IDLE_TIMEOUT;
}

// Subscribe to activity updates
export function onActivityUpdate(callback: () => void): () => void {
  activityListeners.add(callback);
  return () => {
    activityListeners.delete(callback);
  };
}

// Hook to track user activity
export function useActivityTracking() {
  useEffect(() => {
    // Track various user activities
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      trackUserActivity();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for idle periodically
    const checkIdle = setInterval(() => {
      if (isUserIdle()) {
        // Refresh session to keep it alive if user is active
        // But don't auto-refresh if truly idle
        const timeSinceActivity = getTimeSinceLastActivity();
        if (timeSinceActivity > IDLE_TIMEOUT * 2) {
          // User has been idle for 2x the timeout, don't refresh
          return;
        }
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(checkIdle);
    };
  }, []);

  return {
    isIdle: isUserIdle,
    timeSinceLastActivity: getTimeSinceLastActivity,
  };
}

