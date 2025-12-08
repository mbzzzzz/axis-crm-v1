"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface SessionTimeoutWarningProps {
  sessionExpiresAt: number | null;
  onExtendSession: () => Promise<void>;
}

export function SessionTimeoutWarning({
  sessionExpiresAt,
  onExtendSession,
}: SessionTimeoutWarningProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExtending, setIsExtending] = useState(false);

  const handleLogout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await onExtendSession();
      setIsOpen(false);
      setTimeRemaining(0);
    } catch (error) {
      console.error("Failed to extend session:", error);
    } finally {
      setIsExtending(false);
    }
  };

  useEffect(() => {
    if (!sessionExpiresAt) return;

    const checkExpiration = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = sessionExpiresAt;
      const timeLeft = expiresAt - now;

      // Show warning 5 minutes before expiration
      if (timeLeft <= 300 && timeLeft > 0) {
        setIsOpen(true);
        setTimeRemaining(timeLeft);
      } else if (timeLeft <= 0) {
        // Session expired, logout
        handleLogout();
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkExpiration, 10000);
    checkExpiration(); // Initial check

    return () => clearInterval(interval);
  }, [sessionExpiresAt, handleLogout]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" closeButton={false}>
        <DialogHeader>
          <DialogTitle>Session About to Expire</DialogTitle>
          <DialogDescription>
            Your session will expire in {formatTime(timeRemaining)}. Would you like to extend it?
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isExtending}
          >
            Log Out
          </Button>
          <Button onClick={handleExtendSession} disabled={isExtending}>
            {isExtending ? "Extending..." : "Extend Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

