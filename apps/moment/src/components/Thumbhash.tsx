import { createMemo } from "solid-js";
import type { ComponentProps } from "@solidjs/web";
import { thumbHashToDataURL } from "thumbhash";
import { cn } from "@my-moment/ui";
import { omit } from "solid-js";
import { decompressUint8Array } from "~/lib/thumbhash";

export interface ThumbhashProps extends ComponentProps<"img"> {
  thumbHash: string | Uint8Array;
}

export function Thumbhash(props: ThumbhashProps) {
  const local = props;
  const rest = omit(props, "thumbHash", "class");

  const dataURL = createMemo(() => {
    const hash = local.thumbHash;
    if (typeof hash === "string") {
      return thumbHashToDataURL(decompressUint8Array(hash));
    }
    return thumbHashToDataURL(hash);
  });

  return <img {...rest} src={dataURL()} alt="" class={cn("h-full w-full", local.class)} />;
}
