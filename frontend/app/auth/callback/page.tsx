"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase automatically picks up the session from the URL hash/params
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        // No session — wait a moment for Supabase to process the URL hash
        // Then try again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retry = await supabase.auth.getSession();

        if (!retry.data.session) {
          router.push("/auth");
          return;
        }

        const user = retry.data.session.user;
        if (user.user_metadata?.branch && user.user_metadata?.year) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
        return;
      }

      const user = data.session.user;
      if (user.user_metadata?.branch && user.user_metadata?.year) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-black">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Signing you in...</p>
      </div>
    </div>
  );
}
