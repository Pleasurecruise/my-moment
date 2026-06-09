import { render } from "solid-js/web";
import { RouterProvider } from "@tanstack/solid-router";
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
  render(() => <RouterProvider router={router} />, root);
}
