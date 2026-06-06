import { createRootRoute, Link, Outlet } from "@tanstack/solid-router";
import { For, Show, Suspense } from "solid-js";
import { useAuth } from "../lib/auth-context";

export const Route = createRootRoute({
  component: RootLayout,
});

const navItems = [
  { label: "Today", to: "/" },
  { label: "Sign in", to: "/login" },
] as const;

function RootLayout() {
  const auth = useAuth();

  return (
    <div class="app-shell">
      <header class="topbar">
        <nav class="topbar__inner" aria-label="Primary">
          <Link to="/" class="brand" aria-label="My Moment home">
            <span class="brand__mark">M</span>
            <span>My Moment</span>
          </Link>
          <div class="topbar__nav">
            <For each={navItems}>
              {(item) => (
                <Link
                  to={item.to}
                  class="topbar__link"
                  activeProps={{ class: "topbar__link topbar__link--active" }}
                >
                  {item.label}
                </Link>
              )}
            </For>
            <Suspense fallback={<span class="text-sm text-muted-foreground">…</span>}>
              <Show
                when={auth()?.user}
                fallback={<span class="session-pill">Guest</span>}
              >
                {(user) => (
                  <span class="session-pill session-pill--ready">
                    {user().name ?? user().email}
                  </span>
                )}
              </Show>
            </Suspense>
          </div>
        </nav>
      </header>
      <main class="route-frame">
        <Outlet />
      </main>
    </div>
  );
}
