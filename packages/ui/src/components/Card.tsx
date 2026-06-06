import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";

// ---------- Card ----------
export function Card(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        local.class,
      )}
    />
  );
}

// ---------- CardHeader ----------
export function CardHeader(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("flex flex-col space-y-1.5 p-6", local.class)}
    />
  );
}

// ---------- CardTitle ----------
export function CardTitle(props: ComponentProps<"h3">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <h3
      {...rest}
      class={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        local.class,
      )}
    />
  );
}

// ---------- CardDescription ----------
export function CardDescription(props: ComponentProps<"p">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <p
      {...rest}
      class={cn("text-sm text-muted-foreground", local.class)}
    />
  );
}

// ---------- CardContent ----------
export function CardContent(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return <div {...rest} class={cn("p-6 pt-0", local.class)} />;
}

// ---------- CardFooter ----------
export function CardFooter(props: ComponentProps<"div">) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("flex items-center p-6 pt-0", local.class)}
    />
  );
}
