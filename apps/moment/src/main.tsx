import { render } from "solid-js/web";
import { RouterProvider } from "@tanstack/solid-router";
import { AuthProvider } from "./lib/auth-context";
import { getRouter } from "./router";
import "./styles/app.css";

const router = getRouter();

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root was not found.");
}

if (!root.innerHTML) {
  render(
    () => (
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    ),
    root,
  );
}
