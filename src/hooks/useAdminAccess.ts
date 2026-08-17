import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  ADMIN_DEMO_MODE,
  ADMIN_DEMO_STORAGE_KEY,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/admin-demo";

type AccessStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";

type AdminAccess = {
  status: AccessStatus;
  session: Session | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

function hasDemoSession() {
  try {
    return window.localStorage.getItem(ADMIN_DEMO_STORAGE_KEY) === "active";
  } catch {
    return false;
  }
}

function saveDemoSession(active: boolean) {
  try {
    if (active) {
      window.localStorage.setItem(ADMIN_DEMO_STORAGE_KEY, "active");
    } else {
      window.localStorage.removeItem(ADMIN_DEMO_STORAGE_KEY);
    }
  } catch {
    // O modo demo continua válido durante a sessão mesmo se o storage estiver indisponível.
  }
}

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

    if (ADMIN_DEMO_MODE) {
      setStatus(hasDemoSession() ? "authorized" : "unauthenticated");
      return () => {
        mounted = false;
      };
    }

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

      if (ADMIN_DEMO_MODE) {
        const isValid =
          email.trim().toLowerCase() === DEMO_ADMIN_EMAIL.toLowerCase() &&
          password === DEMO_ADMIN_PASSWORD;
        if (!isValid) {
          setStatus("unauthenticated");
          setError("Usuário ou senha de demonstração inválidos.");
          return false;
        }
        saveDemoSession(true);
        setStatus("authorized");
        return true;
      }

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
    if (ADMIN_DEMO_MODE) {
      saveDemoSession(false);
      setSession(null);
      setStatus("unauthenticated");
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return { status, session, error, signIn, signOut };
}
