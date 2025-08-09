import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    // User is not authenticated, redirect to login
    redirect("/login");
  } else {
    // User is authenticated, redirect to dashboard
    redirect("/dashboard");
  }
  
  return null;
}
