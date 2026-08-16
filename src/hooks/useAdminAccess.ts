import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminGetSession, adminLogin, adminLogout } from "@/lib/admin-auth.functions";

type AccessStatus = "loading" | "unauthenticated" | "authorized";

type AdminSession = { email: string; authenticated: true } | null;

type AdminAccess = {
  status: AccessStatus;
  session: AdminSession;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

export function useAdminAccess(): AdminAccess {
  const [status, setStatus] = useState<AccessStatus>("loading");
  const [session, setSession] = useState<AdminSession>(null);
  const [error, setError] = useState<string | null>(null);
  const getSession = useServerFn(adminGetSession);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);

  const refresh = useCallback(async () => {
    try {
      const result = await getSession();
      if (result.authenticated) {
        setSession({ email: result.email, authenticated: true });
        setStatus("authorized");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, [getSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const result = await login({ data: { email, password } });
        setSession({ email: result.email, authenticated: true });
        setStatus("authorized");
        return true;
      } catch (caught) {
        setSession(null);
        setStatus("unauthenticated");
        setError(caught instanceof Error ? caught.message : "Não foi possível iniciar a sessão.");
        return false;
      }
    },
    [login],
  );

  const signOut = useCallback(async () => {
    await logout();
    setSession(null);
    setStatus("unauthenticated");
  }, [logout]);

  return { status, session, error, signIn, signOut };
}
