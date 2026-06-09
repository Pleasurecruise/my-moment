import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";

export interface SkeletonProps extends ComponentProps<"div"> {}

export function Skeleton(props: SkeletonProps) {
  const [local, rest] = splitProps(props, ["class"]);
  return <div {...rest} class={cn("animate-pulse rounded bg-muted", local.class)} />;
}
