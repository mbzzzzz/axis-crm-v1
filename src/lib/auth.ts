import { getSupabaseServerComponentClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = getSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
