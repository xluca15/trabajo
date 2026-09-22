"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BotonSalir() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-fantasma px-2.5"
      title="Salir"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      <span className="sr-only sm:not-sr-only">Salir</span>
    </button>
  );
}
