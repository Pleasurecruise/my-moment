import type { ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils";
import { omit } from "solid-js";

export function Card(props: ComponentProps<"div">) {
  const local = props;
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        local.class,
      )}
    >
      {local.children}
    </div>
  );
}

export function CardHeader(props: ComponentProps<"div">) {
  const local = props;
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={cn("flex flex-col space-y-1.5 p-6", local.class)}>
      {local.children}
    </div>
  );
}

export function CardTitle(props: ComponentProps<"h3">) {
  const local = props;
  const rest = omit(props, "class", "children");
  return (
    <h3 {...rest} class={cn("text-2xl font-semibold leading-none tracking-tight", local.class)}>
      {local.children}
    </h3>
  );
}

export function CardDescription(props: ComponentProps<"p">) {
  const local = props;
  const rest = omit(props, "class", "children");
  return (
    <p {...rest} class={cn("text-sm text-muted-foreground", local.class)}>
      {local.children}
    </p>
  );
}

export function CardContent(props: ComponentProps<"div">) {
  const local = props;
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={cn("p-6 pt-0", local.class)}>
      {local.children}
    </div>
  );
}

export function CardFooter(props: ComponentProps<"div">) {
  const local = props;
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={cn("flex items-center p-6 pt-0", local.class)}>
      {local.children}
    </div>
  );
}
