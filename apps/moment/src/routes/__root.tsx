import { createSignal, onMount, Show } from "solid-js";
import { createRootRoute, Link, Outlet, useRouter } from "@tanstack/solid-router";
import { useSession, signIn, signOut } from "~/lib/services/auth";
import { Images, Camera, ShoppingBag, Sun, Moon, LogIn, LogOut } from "lucide-solid";
import { Avatar, Button, Toaster } from "@my-moment/ui";
import { GallerySettingsProvider } from "~/providers/gallery-settings-provider";

export const Route = createRootRoute({
  component: RootLayout,
});

const THEME_KEY = "my-moment:theme";

const TABS = [
  { href: "/", label: "Gallery", Icon: Images },
  { href: "/snapshot", label: "Snapshot", Icon: Camera },
  { href: "/haul", label: "Haul", Icon: ShoppingBag },
] as const;

function RootLayout() {
  const session = useSession();
  const router = useRouter();

  const [isDark, setIsDark] = createSignal(false);
  const [authOpen, setAuthOpen] = createSignal(false);

  onMount(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  });

  const toggleTheme = () => {
    const next = !isDark();
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const currentPath = () => router.state.location.pathname ?? "/";

  const user = () => session()?.data?.user ?? null;

  const handleSignOut = async () => {
    setAuthOpen(false);
    await signOut();
    window.location.href = "/";
  };

  const handleSignIn = () => {
    setAuthOpen(false);
    signIn.social({ provider: "google", callbackURL: currentPath() });
  };

  return (
    <div class="min-h-screen bg-background text-foreground font-sans">
      <div class="mx-auto max-w-[70rem] px-4 sm:px-8 pb-24 pt-7">
        {/* ── Header ── */}
        <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5 pb-4 border-b border-border mb-4">
          {/* wordmark */}
          <div class="flex flex-col gap-1.5 shrink-0">
            <p class="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <div class="flex items-baseline gap-3">
              <span class="relative font-serif font-semibold tracking-tight leading-none text-foreground text-[36px] max-sm:text-[26px]">
                my moment
                <span class="absolute left-0 -bottom-1.75 h-0.75 w-13 rounded-sm bg-accent" />
              </span>
              <span class="font-serif text-sm text-muted-foreground pb-0.5 hidden lg:inline">
                私の瞬間
              </span>
            </div>
          </div>

          {/* nav + theme + auth */}
          <div class="flex items-center justify-between gap-2 lg:flex-1 lg:justify-end lg:gap-4">
            <nav class="flex gap-1 lg:pr-3 lg:mr-1 lg:border-r lg:border-border">
              {TABS.map(({ href, label, Icon }) => {
                const active = currentPath() === href;
                return (
                  <Link
                    to={href}
                    class={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                      active
                        ? "text-foreground bg-accent/20 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={13} />
                    <span class="hidden lg:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div class="flex items-center gap-2 shrink-0">
              {/* theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                onclick={toggleTheme}
                aria-label={isDark() ? "Switch to light mode" : "Switch to dark mode"}
              >
                <Show when={isDark()} fallback={<Moon size={15} />}>
                  <Sun size={15} />
                </Show>
              </Button>

              {/* auth */}
              <div class="relative">
                <Show
                  when={user()}
                  fallback={
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                      onclick={() => setAuthOpen((v) => !v)}
                      aria-label="Sign in"
                    >
                      <LogIn size={15} />
                    </Button>
                  }
                >
                  {(u) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      class="rounded-full focus-visible:ring-2 focus-visible:ring-accent shrink-0"
                      onclick={() => setAuthOpen((v) => !v)}
                    >
                      <Avatar src={u().image ?? undefined} fallback={u().name ?? "?"} size="sm" />
                    </Button>
                  )}
                </Show>

                {/* dropdown */}
                <Show when={authOpen()}>
                  <div class="absolute right-0 top-full mt-2 z-50 w-52 rounded-lg border border-border bg-card shadow-md p-0">
                    <Show
                      when={user()}
                      fallback={
                        <div class="flex flex-col items-center gap-3 py-4 px-4">
                          <Avatar size="lg" fallback="?" />
                          <p class="text-sm text-muted-foreground">Not signed in</p>
                          <Button size="sm" class="w-full gap-2" onclick={handleSignIn}>
                            <svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                            Sign in with Google
                          </Button>
                        </div>
                      }
                    >
                      {(u) => (
                        <div class="flex flex-col items-center gap-3 py-4 px-4">
                          <Avatar
                            src={u().image ?? undefined}
                            fallback={u().name ?? "?"}
                            size="lg"
                          />
                          <div class="text-center">
                            <p class="text-sm font-medium">{u().name}</p>
                            <p class="text-xs text-muted-foreground truncate max-w-44">
                              {u().email}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            class="w-full gap-2 text-muted-foreground"
                            onclick={handleSignOut}
                          >
                            <LogOut size={13} /> Sign out
                          </Button>
                        </div>
                      )}
                    </Show>
                  </div>
                </Show>

                {/* backdrop to close */}
                <Show when={authOpen()}>
                  <div class="fixed inset-0 z-40" onclick={() => setAuthOpen(false)} />
                </Show>
              </div>
            </div>
          </div>
        </header>

        <GallerySettingsProvider>
          <Outlet />
        </GallerySettingsProvider>

        <Toaster />
      </div>
    </div>
  );
}
