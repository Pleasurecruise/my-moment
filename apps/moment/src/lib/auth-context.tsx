import {
  createContext,
  createResource,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import type { User, Session } from "better-auth";

interface AuthState {
  user: User | null;
  session: Session | null;
}

type AuthAccessor = Accessor<AuthState | undefined>;

const AuthCtx = createContext<AuthAccessor>();

export function AuthProvider(props: ParentProps) {
  const [auth] = createResource<AuthState>(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return { user: null, session: null };
      return await res.json();
    } catch (error) {
      console.error("Failed to fetch auth session:", error);
      return { user: null, session: null };
    }
  });

  return (
    <AuthCtx.Provider value={auth}>{props.children}</AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    const fallback: AuthAccessor = () => ({
      user: null,
      session: null,
    });
    return fallback;
  }
  return ctx;
}

export function useUser(): Accessor<User | null> {
  const auth = useAuth();
  return () => auth()?.user ?? null;
}

export function useSession(): Accessor<Session | null> {
  const auth = useAuth();
  return () => auth()?.session ?? null;
}
