import { Show, For, createSignal } from "solid-js";
import { Button, Badge, Input, cn } from "@my-moment/ui";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  RotateCcw,
  Clock,
  ArrowUpAZ,
  ArrowDownAZ,
  Star,
} from "lucide-solid";
import {
  CATEGORY_CONFIG,
  RATING_CONFIG,
  type Category,
  type FilterState,
  type Rating,
  type ViewMode,
} from "./types";

const SORT_OPTIONS = [
  { value: "newest", label: "最新添加", icon: Clock },
  { value: "price-asc", label: "价格从低", icon: ArrowUpAZ },
  { value: "price-desc", label: "价格从高", icon: ArrowDownAZ },
  { value: "rating", label: "评价最高", icon: Star },
] as const;

interface FilterBarProps {
  store: {
    filter: () => FilterState;
    viewMode: () => ViewMode;
    updateFilter: (partial: Partial<FilterState>) => void;
    resetFilter: () => void;
    updateViewMode: (mode: ViewMode) => void;
  };
}

export function FilterBar(props: FilterBarProps) {
  const [expanded, setExpanded] = createSignal(false);

  const hasActiveFilters = () =>
    props.store.filter().search ||
    props.store.filter().categories.length > 0 ||
    props.store.filter().ratings.length > 0 ||
    props.store.filter().sortBy !== "newest";

  const toggleCategory = (cat: Category) => {
    const current = props.store.filter().categories;
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    props.store.updateFilter({ categories: next });
  };

  const toggleRating = (rating: Rating) => {
    const current = props.store.filter().ratings;
    const next = current.includes(rating)
      ? current.filter((r) => r !== rating)
      : [...current, rating];
    props.store.updateFilter({ ratings: next });
  };

  return (
    <div class="space-y-3">
      {/* 主搜索栏 */}
      <div class="flex items-center gap-2">
        {/* 搜索输入 */}
        <div class="relative flex-1">
          <Search
            size={16}
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="text"
            value={props.store.filter().search}
            onInput={(e) => props.store.updateFilter({ search: e.currentTarget.value })}
            placeholder="搜索好物名称、品牌、标签..."
            class="pl-9 pr-9"
          />
          <Show when={props.store.filter().search}>
            <button
              type="button"
              onClick={() => props.store.updateFilter({ search: "" })}
              class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="清除搜索"
            >
              <X size={14} />
            </button>
          </Show>
        </div>

        {/* 筛选展开按钮 */}
        <Button
          variant={expanded() ? "default" : "outline"}
          size="icon"
          onClick={() => setExpanded(!expanded())}
          class={cn(
            "shrink-0 relative",
            hasActiveFilters() && !expanded() && "ring-2 ring-primary/20",
          )}
          title="筛选"
        >
          <SlidersHorizontal size={16} />
          <Show when={hasActiveFilters() && !expanded()}>
            <span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          </Show>
        </Button>

        {/* 视图切换 */}
        <div class="shrink-0 flex items-center bg-muted rounded-md p-0.5 border border-border">
          <button
            type="button"
            onClick={() => props.store.updateViewMode("grid")}
            class={cn(
              "p-1.5 rounded-lg transition-all duration-150 cursor-pointer",
              props.store.viewMode() === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="网格视图"
          >
            <Grid3X3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => props.store.updateViewMode("list")}
            class={cn(
              "p-1.5 rounded-lg transition-all duration-150 cursor-pointer",
              props.store.viewMode() === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="列表视图"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* 展开的筛选面板 */}
      <Show when={expanded()}>
        <div class="bg-card rounded-lg border border-border shadow-sm p-4 space-y-4">
          {/* 分类筛选 */}
          <div>
            <p class="text-xs font-semibold text-muted-foreground mb-2">分类</p>
            <div class="flex flex-wrap gap-1.5">
              <For each={Object.keys(CATEGORY_CONFIG) as Category[]}>
                {(cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const isActive = () => props.store.filter().categories.includes(cat);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      class={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer select-none",
                        isActive()
                          ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted",
                      )}
                    >
                      {config.label}
                    </button>
                  );
                }}
              </For>
            </div>
          </div>

          {/* 评价等级筛选 */}
          <div>
            <p class="text-xs font-semibold text-muted-foreground mb-2">评价</p>
            <div class="flex flex-wrap gap-2">
              <For each={Object.keys(RATING_CONFIG) as Rating[]}>
                {(rating) => {
                  const config = RATING_CONFIG[rating];
                  const isActive = () => props.store.filter().ratings.includes(rating);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleRating(rating)}
                      class={cn(
                        "transition-all duration-150 cursor-pointer",
                        isActive()
                          ? "scale-105 ring-2 ring-primary/20 rounded-full"
                          : "opacity-50 hover:opacity-75",
                      )}
                    >
                      <Badge
                        variant="outline"
                        class="text-xs"
                        style={{ "border-color": config.color, color: config.color }}
                      >
                        {config.label}
                      </Badge>
                    </button>
                  );
                }}
              </For>
            </div>
          </div>

          {/* 排序 */}
          <div>
            <p class="text-xs font-semibold text-muted-foreground mb-2">排序</p>
            <div class="flex flex-wrap gap-1.5">
              <For each={SORT_OPTIONS}>
                {(opt) => {
                  const isActive = () => props.store.filter().sortBy === opt.value;
                  return (
                    <button
                      type="button"
                      onClick={() => props.store.updateFilter({ sortBy: opt.value })}
                      class={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer select-none",
                        isActive()
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/20 hover:bg-muted",
                      )}
                    >
                      <opt.icon size={12} />
                      {opt.label}
                    </button>
                  );
                }}
              </For>
            </div>
          </div>

          {/* 重置筛选 */}
          <Show when={hasActiveFilters()}>
            <div class="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  props.store.resetFilter();
                  setExpanded(false);
                }}
                class="text-xs text-muted-foreground"
              >
                <RotateCcw size={12} />
                重置所有筛选
              </Button>
            </div>
          </Show>
        </div>
      </Show>

      {/* 激活的筛选标签（收起面板时显示） */}
      <Show when={!expanded() && hasActiveFilters()}>
        <div class="flex items-center gap-1.5 flex-wrap">
          <For each={props.store.filter().categories}>
            {(cat) => {
              const config = CATEGORY_CONFIG[cat];
              return (
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  {config.label}
                  <X size={10} class="ml-0.5" />
                </button>
              );
            }}
          </For>
          <For each={props.store.filter().ratings}>
            {(rating) => (
              <button
                type="button"
                onClick={() => toggleRating(rating)}
                class="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Badge
                  variant="outline"
                  class="text-[11px]"
                  style={{
                    "border-color": RATING_CONFIG[rating].color,
                    color: RATING_CONFIG[rating].color,
                  }}
                >
                  {RATING_CONFIG[rating].label}
                </Badge>
              </button>
            )}
          </For>
          <Show when={props.store.filter().sortBy !== "newest"}>
            <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-muted-foreground bg-muted border border-border rounded-full">
              {SORT_OPTIONS.find((o) => o.value === props.store.filter().sortBy)?.label}
            </span>
          </Show>
          <button
            type="button"
            onClick={props.store.resetFilter}
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw size={10} />
            清除
          </button>
        </div>
      </Show>
    </div>
  );
}
