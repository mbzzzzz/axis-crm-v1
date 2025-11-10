"use client";

import { useUser, useAuth } from "@clerk/nextjs";

export function useSession() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  return {
    data: user
      ? {
          user: {
            id: user.id,
            name: user.fullName || user.firstName || "User",
            email: user.primaryEmailAddress?.emailAddress || "",
            image: user.imageUrl || "",
          },
        }
      : null,
    isPending: !isLoaded,
    error: null,
    refetch: async () => {
      // Clerk handles this automatically
    },
  };
}

export const authClient = {
  signOut: async () => {
    // This will be handled by Clerk's signOut
    return { error: null };
  },
};
