import { currentUser } from "@clerk/nextjs/server";

// Get current user from Clerk
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}
