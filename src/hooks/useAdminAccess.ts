import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AccessStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";

type AdminAccess = {
  status: AccessStatus;
  session: Session | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

export function useAdminAccess(): AdminAccess {
  const [status, setStatus] = useState<AccessStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolveAccess = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setStatus("unauthenticated");
      return;
    }

    const { data, error: membershipError } = await supabase
      .from("staff_users")
      .select("role")
      .eq("user_id", nextSession.user.id)
      .in("role", ["staff", "admin"])
      .maybeSingle();

    if (membershipError || !data) {
      setStatus("unauthorized");
      setError("Esta conta não possui acesso ao painel administrativo.");
      return;
    }

    setError(null);
    setStatus("authorized");
  }, []);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) void resolveAccess(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) void resolveAccess(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveAccess]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.session) {
        setStatus("unauthenticated");
        setError(signInError?.message || "Não foi possível iniciar a sessão.");
        return false;
      }

      await resolveAccess(data.session);
      return true;
    },
    [resolveAccess],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return { status, session, error, signIn, signOut };
}
