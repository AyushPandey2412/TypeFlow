"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ProductTour } from "../components/product-tour";
import { apiRequest } from "../services/api-client";
import type { AuthUser } from "../services/auth.service";
import { useAuth } from "../stores/auth";

let pendingSession: Promise<{ user: AuthUser }> | null = null;

function SessionProvider({ client }: { client: QueryClient }) {
  const userId = useAuth(state => state.user?.id);
  useEffect(() => {
    let active = true;
    // Reading /me preserves guest sessions and avoids rotating valid tokens.
    pendingSession ??= apiRequest<{ user: AuthUser }>("/api/auth/me")
      .finally(() => { pendingSession = null; });
    const initialUser = useAuth.getState().user;
    void pendingSession.then(({ user }) => {
      if (active && useAuth.getState().user === initialUser) useAuth.getState().setUser(user);
    }).catch(() => {
      // Leave the app usable when the network is unavailable.
    }).finally(() => { if (active) useAuth.getState().setHydrated(); });
    return () => { active = false; };
  }, []);
  useEffect(() => { void client.resetQueries(); }, [client, userId]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}><SessionProvider client={client}/>{children}<ProductTour/></QueryClientProvider>;
}
