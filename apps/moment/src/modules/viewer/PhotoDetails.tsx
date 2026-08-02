import { For, Show, createMemo } from "solid-js";
import { Badge, Card, cn } from "@my-moment/ui";
import type { LabelValueProps, PhotoDetailsProps } from "~/types";

export function PhotoDetails(props: PhotoDetailsProps) {
  const date = createMemo(() => {
    if (!props.photo.date) return null;
    const parsed = new Date(props.photo.date);
    return Number.isNaN(parsed.getTime())
      ? props.photo.date
      : parsed.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  });
  const dimensions = () =>
    props.photo.width > 0 && props.photo.height > 0
      ? `${props.photo.width} × ${props.photo.height}`
      : null;
  const size = () =>
    props.photo.size
      ? props.photo.size >= 1024 * 1024
        ? `${(props.photo.size / 1024 / 1024).toFixed(1)} MB`
        : `${Math.round(props.photo.size / 1024)} KB`
      : null;
  const hasFileInfo = () => Boolean(dimensions() || props.photo.format || size());

  return (
    <div class={cn("space-y-4", props.class)}>
      <div>
        <h2 class="font-serif text-xl font-semibold tracking-tight text-foreground">
          {props.photo.title}
        </h2>
        <Show when={props.photo.description}>
          <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {props.photo.description}
          </p>
        </Show>
      </div>

      <Show when={date()}>
        <Detail label="Date" value={date()!} />
      </Show>
      <Show when={props.photo.geo}>
        {(geo) => (
          <Detail label="Location" value={`${geo().lat.toFixed(5)}, ${geo().lng.toFixed(5)}`} />
        )}
      </Show>
      <Show when={hasFileInfo()}>
        <Card class="grid grid-cols-2 gap-px overflow-hidden bg-border p-0 text-sm sm:grid-cols-3">
          <Show when={dimensions()}>
            <MetaCell label="Dimensions" value={dimensions()!} />
          </Show>
          <Show when={props.photo.format}>
            <MetaCell label="Format" value={props.photo.format!} />
          </Show>
          <Show when={size()}>
            <MetaCell label="Size" value={size()!} />
          </Show>
        </Card>
      </Show>
      <Show when={props.photo.tags?.length}>
        <div>
          <p class="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Tags</p>
          <div class="flex flex-wrap gap-1.5">
            <For each={props.photo.tags}>{(tag) => <Badge variant="outline">{tag}</Badge>}</For>
          </div>
        </div>
      </Show>
    </div>
  );
}

function Detail(props: LabelValueProps) {
  return (
    <Card class="p-3">
      <p class="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{props.label}</p>
      <p class="mt-1 text-sm text-foreground">{props.value}</p>
    </Card>
  );
}

function MetaCell(props: LabelValueProps) {
  return (
    <div class="bg-card p-3">
      <p class="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{props.label}</p>
      <p class="mt-1 text-sm text-foreground">{props.value}</p>
    </div>
  );
}
