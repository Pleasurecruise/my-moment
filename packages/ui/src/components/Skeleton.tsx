import type { ComponentProps } from "@solidjs/web";
import { cn } from "../lib/utils";
import { omit } from "solid-js";

export interface SkeletonProps extends ComponentProps<"div"> {}

export function Skeleton(props: SkeletonProps) {
  const local = props;
  const rest = omit(props, "class");
  return <div {...rest} class={cn("animate-pulse rounded bg-muted", local.class)} />;
}
