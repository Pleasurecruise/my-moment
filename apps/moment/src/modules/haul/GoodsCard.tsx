import { Show } from "solid-js";
import { Card, Badge, cn } from "@my-moment/ui";
import { Calendar, ChevronRight } from "lucide-solid";
import type { GoodsItem } from "./types";
import { formatPrice, formatDate, timeAgo, getCategoryConfig, getRatingConfig } from "./utils";

interface GoodsCardProps {
  item: GoodsItem;
  onClick?: (item: GoodsItem) => void;
  compact?: boolean;
}

export function GoodsCard(props: GoodsCardProps) {
  const category = () => getCategoryConfig(props.item.category);
  const ratingConfig = () => getRatingConfig(props.item.rating);

  return (
    <Card
      class={cn(
        "group relative cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        props.compact ? "flex gap-3 p-3" : "flex flex-col",
      )}
      onClick={() => props.onClick?.(props.item)}
    >
      {/* 图片区域（非紧凑模式） */}
      <Show when={!props.compact && props.item.imageUrl}>
        <div class="relative aspect-[4/3] overflow-hidden bg-muted rounded-t-lg">
          <img
            src={props.item.imageUrl}
            alt={props.item.name}
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* 渐变遮罩 */}
          <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
          {/* 价格标签 */}
          <div class="absolute top-3 right-3">
            <span class="px-2.5 py-1 text-sm font-bold text-white bg-black/40 backdrop-blur-md rounded-full">
              {formatPrice(props.item.price)}
            </span>
          </div>
        </div>
      </Show>

      {/* 紧凑模式的缩略图 */}
      <Show when={props.compact && props.item.imageUrl}>
        <div class="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
          <img
            src={props.item.imageUrl}
            alt={props.item.name}
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </Show>

      {/* 紧凑模式无图片的占位 */}
      <Show when={props.compact && !props.item.imageUrl}>
        <div class="shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
          <span class="text-2xl">📦</span>
        </div>
      </Show>

      {/* 内容区 */}
      <div class={cn("flex-1 min-w-0", props.compact ? "py-0.5" : "p-4 pt-3")}>
        {/* 头部：分类 + 评价 */}
        <div class="flex items-center gap-2 mb-1.5">
          <Badge variant="secondary" class="text-[11px]">
            {category().label}
          </Badge>
          <Badge
            variant="outline"
            class="text-[11px]"
            style={{
              "border-color": ratingConfig().color,
              color: ratingConfig().color,
            }}
          >
            {ratingConfig().label}
          </Badge>
        </div>

        {/* 名称 + 品牌 */}
        <h3 class="text-[15px] font-semibold leading-snug truncate group-hover:text-primary transition-colors">
          {props.item.name}
        </h3>
        <Show when={props.item.brand}>
          <p class="text-xs text-muted-foreground mt-0.5 truncate">{props.item.brand}</p>
        </Show>

        {/* 评价预览 */}
        <Show when={!props.compact && props.item.comment}>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            "{props.item.comment}"
          </p>
        </Show>

        {/* 底部信息 */}
        <Show when={!props.compact}>
          <div class="mt-3 pt-3 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground">
            {/* 价格（无图片时显示在这里） */}
            <Show when={!props.item.imageUrl}>
              <span class="font-semibold text-sm text-foreground">
                {formatPrice(props.item.price)}
              </span>
            </Show>
            <span class="inline-flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(props.item.purchaseDate)}
            </span>
            <span class="text-xs text-muted-foreground/60">{timeAgo(props.item.createdAt)}</span>
            <ChevronRight
              size={14}
              class="ml-auto text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
        </Show>

        {/* 紧凑模式的价格和时间 */}
        <Show when={props.compact}>
          <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span class="font-semibold text-foreground">{formatPrice(props.item.price)}</span>
            <span>·</span>
            <span>{timeAgo(props.item.createdAt)}</span>
          </div>
        </Show>
      </div>

      {/* 紧凑模式右侧箭头 */}
      <Show when={props.compact}>
        <div class="flex items-center pr-1">
          <ChevronRight
            size={16}
            class="text-muted-foreground group-hover:text-primary transition-colors"
          />
        </div>
      </Show>
    </Card>
  );
}
