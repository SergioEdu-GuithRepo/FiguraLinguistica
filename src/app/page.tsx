"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function Root() {
  const { ready, user, state } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/entrar");
    else if (state && !state.onboarded) router.replace("/boas-vindas");
    else router.replace("/inicio");
  }, [ready, user, state, router]);
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-coral-soft)] border-t-[var(--color-coral)]" />
    </div>
  );
}
