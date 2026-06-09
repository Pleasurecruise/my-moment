import { createMemo, splitProps, type ComponentProps } from "solid-js";
import { thumbHashToDataURL } from "thumbhash";
import { cn } from "@my-moment/ui";
import { decompressUint8Array } from "~/lib/thumbhash";

export interface ThumbhashProps extends ComponentProps<"img"> {
  thumbHash: string | Uint8Array;
}

export function Thumbhash(props: ThumbhashProps) {
  const [local, rest] = splitProps(props, "thumbHash", "class");

  const dataURL = createMemo(() => {
    const hash = local.thumbHash;
    if (typeof hash === "string") {
      return thumbHashToDataURL(decompressUint8Array(hash));
    }
    return thumbHashToDataURL(hash);
  });

  return <img {...rest} src={dataURL()} alt="" class={cn("h-full w-full", local.class)} />;
}
