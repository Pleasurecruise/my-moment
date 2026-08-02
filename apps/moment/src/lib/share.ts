import { toast } from "@my-moment/ui";
import type { ShareLinkOptions } from "~/types";

export async function shareLink(options: ShareLinkOptions): Promise<void> {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(options.url);
    toast.success(options.successMessage ?? "Link copied");
  } catch (clipboardError) {
    if (!navigator.share) {
      toast.error(
        clipboardError instanceof Error ? clipboardError.message : "Sharing is unavailable",
      );
      return;
    }
    try {
      await navigator.share({ url: options.url, title: options.title });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      toast.error(shareError instanceof Error ? shareError.message : "Could not share this link");
    }
  }
}
