import { Show } from "solid-js";
import { Badge, cn } from "@my-moment/ui";
import { Heart } from "lucide-solid";
import type { WishItem } from "./types";
import { formatPrice, getCategoryConfig } from "./utils";

interface WishCardProps {
  item: WishItem;
  onClick?: (item: WishItem) => void;
}

export function WishCard(props: WishCardProps) {
  const category = () => getCategoryConfig(props.item.category);

  return (
    <div
      class={cn(
        "group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4",
        "transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        "cursor-pointer",
      )}
      onClick={() => props.onClick?.(props.item)}
    >
      <div class="shrink-0 size-18 rounded-lg overflow-hidden bg-muted border border-border/50">
        <Show
          when={props.item.imageUrl}
          fallback={
            <div class="flex size-full items-center justify-center text-muted-foreground">
              <Heart size={22} class="opacity-30" />
            </div>
          }
        >
          <img
            src={props.item.imageUrl}
            alt={props.item.name}
            class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Show>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <Badge variant="secondary" class="text-[10px]">
            {category().label}
          </Badge>
        </div>
        <h3 class="text-sm font-semibold leading-snug truncate group-hover:text-primary transition-colors">
          {props.item.name}
        </h3>
        <Show when={props.item.brand}>
          <p class="text-xs text-muted-foreground mt-0.5 truncate">{props.item.brand}</p>
        </Show>
        <p class="mt-1.5 text-sm font-bold text-primary">{formatPrice(props.item.price)}</p>
      </div>
    </div>
  );
}
