import { For, Show, createMemo, createSignal } from "solid-js";
import { Smile } from "lucide-solid";
import { Popover, PopoverContent, PopoverTrigger } from "@my-moment/ui";
import { EMOJI_PACKS, emojiInputValue } from "~/lib/emojis";

interface EmojiPickerProps {
  onSelect: (value: string) => void;
}

export function EmojiPicker(props: EmojiPickerProps) {
  const [open, setOpen] = createSignal(false);
  const [activeKey, setActiveKey] = createSignal(EMOJI_PACKS[0]?.key ?? "");
  const activePack = createMemo(
    () => EMOJI_PACKS.find((pack) => pack.key === activeKey()) ?? EMOJI_PACKS[0],
  );

  const select = (value: string) => {
    props.onSelect(value);
    setOpen(false);
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="top-start" gutter={8}>
      <PopoverTrigger
        class="inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Choose an emoji"
      >
        <Smile size={14} />
        Emoji
      </PopoverTrigger>
      <PopoverContent class="w-[min(22rem,calc(100vw-2rem))] overflow-hidden p-0">
        <div class="max-h-60 overflow-y-auto p-2">
          <Show when={activePack()}>
            {(pack) => (
              <div
                class={
                  pack().type === "image"
                    ? pack().display === "sticker"
                      ? "grid grid-cols-3 gap-1.5 sm:grid-cols-4"
                      : "grid grid-cols-6 gap-1 sm:grid-cols-8"
                    : "flex flex-wrap gap-1"
                }
              >
                <For each={pack().items}>
                  {(item) => (
                    <button
                      type="button"
                      title={item.name}
                      aria-label={item.name}
                      onClick={() => select(emojiInputValue(pack(), item))}
                      class={
                        pack().type === "image"
                          ? "flex aspect-square items-center justify-center rounded-md p-1 transition hover:bg-muted active:scale-95"
                          : "rounded-md px-2 py-1.5 text-sm transition hover:bg-muted active:scale-95"
                      }
                    >
                      <Show when={pack().type === "image"} fallback={item.value}>
                        <img
                          src={item.value}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          class={
                            pack().display === "sticker"
                              ? "size-16 object-contain sm:size-[4.5rem]"
                              : "size-8 object-contain"
                          }
                        />
                      </Show>
                    </button>
                  )}
                </For>
              </div>
            )}
          </Show>
        </div>
        <div class="flex gap-1 overflow-x-auto border-t border-border/70 p-1.5">
          <For each={EMOJI_PACKS}>
            {(pack) => (
              <button
                type="button"
                onClick={() => setActiveKey(pack.key)}
                class={`shrink-0 rounded px-2.5 py-1 text-xs transition-colors ${
                  activeKey() === pack.key
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {pack.name}
              </button>
            )}
          </For>
        </div>
      </PopoverContent>
    </Popover>
  );
}
