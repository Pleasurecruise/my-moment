import { createSignal, onMount, Show } from "solid-js";
import { createRootRoute, Link, Outlet, useRouter } from "@tanstack/solid-router";
import { useSession, signIn, signOut } from "~/lib/services/auth";
import { Images, Map, MessageCircle, Library, Sun, Moon, LogIn, LogOut } from "lucide-solid";
import {
  Avatar,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Toaster,
  applyTheme,
} from "@my-moment/ui";
import { GallerySettingsProvider } from "~/providers/gallery-settings-provider";

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    meta: [
      { property: "og:site_name", content: "My Moment" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const THEME_KEY = "my-moment:theme";

const TABS = [
  { href: "/", label: "Gallery", Icon: Images },
  { href: "/journey", label: "Journey", Icon: Map },
  { href: "/messages", label: "Guestbook", Icon: MessageCircle },
  { href: "/collection", label: "Collection", Icon: Library },
] as const;

function RootLayout() {
  const session = useSession();
  const router = useRouter();

  const [isDark, setIsDark] = createSignal(false);
  const [themeBtnEl, setThemeBtnEl] = createSignal<HTMLButtonElement | null>(null);

  onMount(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const dark = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  });

  const toggleTheme = (btn?: HTMLButtonElement) => {
    const next = !isDark();
    setIsDark(next);
    applyTheme(next, btn ?? themeBtnEl());
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const currentPath = () => router.state.location.pathname ?? "/";
  const isJourney = () => currentPath() === "/journey" || currentPath().startsWith("/journey/");
  const tabIsActive = (href: string) =>
    href === "/"
      ? currentPath() === "/" || currentPath().startsWith("/photos/")
      : currentPath() === href || currentPath().startsWith(`${href}/`);

  const user = () => session()?.data?.user ?? null;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const handleSignIn = () => {
    signIn.social({ provider: "google", callbackURL: currentPath() });
  };

  const AuthDropdown = () => (
    <Popover placement="bottom-end">
      <PopoverTrigger as={"div"} class="inline-flex">
        <Show
          when={user()}
          fallback={
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
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
            >
              <Avatar src={u().image ?? undefined} fallback={u().name ?? "?"} size="sm" />
            </Button>
          )}
        </Show>
      </PopoverTrigger>
      <PopoverContent class="w-52 p-0">
        <Show
          when={user()}
          fallback={
            <div class="flex flex-col items-center gap-3 py-4 px-4">
              <Avatar size="lg" fallback="?" />
              <p class="text-sm text-muted-foreground">Not signed in</p>
              <Button size="sm" class="w-full gap-2" onClick={handleSignIn}>
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
              <Avatar src={u().image ?? undefined} fallback={u().name ?? "?"} size="lg" />
              <p class="text-center text-sm font-medium">{u().name}</p>
              <Button
                variant="outline"
                size="sm"
                class="w-full gap-2 text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut size={13} /> Sign out
              </Button>
            </div>
          )}
        </Show>
      </PopoverContent>
    </Popover>
  );

  return (
    <div
      id="app-scroll-container"
      class="min-h-screen bg-background text-foreground font-sans overflow-x-hidden overflow-y-auto"
    >
      <header class="sticky top-0 z-30 flex items-center justify-between px-4 h-12 bg-background/95 backdrop-blur-sm border-b border-border lg:hidden">
        <div class="flex items-center gap-2">
          <span class="font-serif font-semibold text-foreground tracking-tight">my moment</span>
        </div>
        <div class="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            ref={setThemeBtnEl}
            class="h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            onclick={(e) => toggleTheme(e.currentTarget)}
            aria-label={isDark() ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Show when={isDark()} fallback={<Moon size={15} />}>
              <Sun size={15} />
            </Show>
          </Button>
          <AuthDropdown />
        </div>
      </header>

      <div
        class={
          isJourney()
            ? "flex h-[calc(100dvh-3rem)] flex-col pt-4 lg:h-dvh lg:pt-7"
            : "pb-24 pt-7 max-lg:pt-4"
        }
      >
        <header class="mx-auto hidden w-full max-w-[70rem] px-8 lg:flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5 pb-4 border-b border-border mb-4">
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
              <span class="relative font-serif font-semibold tracking-tight leading-none text-foreground text-[36px]">
                my moment
                <span class="absolute left-0 -bottom-1.75 h-0.75 w-13 rounded-sm bg-accent" />
              </span>
              <span class="font-serif text-sm text-muted-foreground pb-0.5">私の瞬間</span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 lg:flex-1 lg:justify-end lg:gap-4">
            <nav
              aria-label="Primary"
              class="flex gap-1 lg:pr-3 lg:mr-1 lg:border-r lg:border-border"
            >
              {TABS.map(({ href, label, Icon }) => {
                const active = tabIsActive(href);
                return (
                  <Link
                    to={href}
                    aria-current={active ? "page" : undefined}
                    class={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      active
                        ? "text-foreground bg-accent/20 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={13} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div class="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                ref={setThemeBtnEl}
                class="h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                onclick={(e) => toggleTheme(e.currentTarget)}
                aria-label={isDark() ? "Switch to light mode" : "Switch to dark mode"}
              >
                <Show when={isDark()} fallback={<Moon size={15} />}>
                  <Sun size={15} />
                </Show>
              </Button>

              <AuthDropdown />
            </div>
          </div>
        </header>

        <nav
          aria-label="Primary"
          class="mx-auto mb-4 flex w-full max-w-[70rem] gap-0.5 px-3 sm:gap-1 sm:px-8 lg:hidden"
        >
          {TABS.map(({ href, label, Icon }) => {
            const active = tabIsActive(href);
            return (
              <Link
                to={href}
                aria-current={active ? "page" : undefined}
                class={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-0 sm:flex-none sm:flex-row sm:px-3 sm:py-2 sm:text-xs ${
                  active
                    ? "text-foreground bg-accent/20 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                <span class="leading-none">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div class={isJourney() ? "min-h-0 w-full flex-1" : "mx-auto max-w-[70rem] px-4 sm:px-8"}>
          <GallerySettingsProvider>
            <Show when={currentPath()} keyed>
              <Outlet />
            </Show>
          </GallerySettingsProvider>
        </div>

        <Toaster />
      </div>
    </div>
  );
}
