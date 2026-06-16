import { createFileRoute, Link } from "@tanstack/solid-router";
import { Show, createMemo } from "solid-js";
import { ArrowLeft, Share2, Edit3, Calendar, Maximize2, FileIcon, Tag } from "lucide-solid";
import { Button, Badge, Card, toast } from "@my-moment/ui";
import type { PhotoItem } from "~/types/photo";

export const Route = createFileRoute("/photos/$id/")({
  component: PhotoDetailPage,
  head: ({ loaderData }) => {
    const photo = loaderData as PhotoItem | null | undefined;
    if (!photo) {
      return {
        meta: [
          { title: "Photo Not Found — My Moment" },
          { property: "og:title", content: "Photo Not Found — My Moment" },
          {
            property: "og:description",
            content: "The requested photo could not be found.",
          },
        ],
      };
    }
    const description = photo.description || photo.title || "A photo from My Moment";
    return {
      meta: [
        { title: `${photo.title} — My Moment` },
        { property: "og:title", content: `${photo.title} — My Moment` },
        { property: "og:description", content: description.slice(0, 160) },
        { property: "og:image", content: "/api/og/gallery" },
        { property: "og:url", content: `/photos/${photo.id}` },
        { property: "og:type", content: "article" },
      ],
    };
  },
  loader: async ({ params }) => {
    const res = await fetch(`/api/photos/${params.id}`);
    if (!res.ok) return null;
    return (await res.json()) as PhotoItem;
  },
});

function PhotoDetailPage() {
  const photo = Route.useLoaderData() as () => PhotoItem | null;
  const params = Route.useParams();

  const formattedDate = createMemo(() => {
    const p = photo();
    if (!p?.date) return null;
    try {
      return new Date(p.date).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return p.date;
    }
  });

  const handleShare = () => {
    const url = `${window.location.origin}/photos/${params().id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => {
        // Fallback to Web Share API
        navigator.share?.({
          url,
          title: photo()?.title || "Photo",
        });
      });
  };

  return (
    <div class="mx-auto max-w-4xl space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Link
            to="/"
            class="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 class="text-lg font-semibold text-foreground">
            <Show when={photo()} fallback="Photo Details">
              {photo()!.title}
            </Show>
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            class="size-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleShare}
            aria-label="Share photo"
          >
            <Share2 size={15} />
          </Button>
          <Show when={photo()}>
            <Link
              to="/photos/$id/edit"
              params={{ id: params().id }}
              class="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Edit photo"
            >
              <Edit3 size={15} />
            </Link>
          </Show>
        </div>
      </div>

      <Show
        when={photo()}
        fallback={
          <div class="flex items-center justify-center py-20 text-muted-foreground">
            <p>Photo not found</p>
          </div>
        }
      >
        {(p) => (
          <div class="space-y-6">
            {/* Photo */}
            <div class="overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={p().url}
                alt={p().title}
                class="w-full object-contain"
                style={{ "max-height": "70vh" }}
              />
            </div>

            {/* Info Cards */}
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Show when={formattedDate()}>
                <Card class="p-4">
                  <div class="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar size={14} />
                    <span class="text-xs">Date</span>
                  </div>
                  <p class="text-foreground">{formattedDate()}</p>
                </Card>
              </Show>

              <Card class="p-4">
                <div class="flex items-center gap-2 text-muted-foreground mb-1">
                  <Maximize2 size={14} />
                  <span class="text-xs">Dimensions</span>
                </div>
                <p class="text-foreground">
                  {p().width} × {p().height}
                </p>
              </Card>

              <Card class="p-4">
                <div class="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileIcon size={14} />
                  <span class="text-xs">Format</span>
                </div>
                <p class="text-foreground">{p().format}</p>
              </Card>

              <Show when={p().size}>
                <Card class="p-4">
                  <div class="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileIcon size={14} />
                    <span class="text-xs">Size</span>
                  </div>
                  <p class="text-foreground">{((p().size ?? 0) / 1024 / 1024).toFixed(1)} MB</p>
                </Card>
              </Show>
            </div>

            {/* Description */}
            <Show when={p().description}>
              <Card class="p-4">
                <p class="text-sm leading-relaxed text-muted-foreground">{p().description}</p>
              </Card>
            </Show>

            {/* Tags */}
            <Show when={p().tags && p().tags.length > 0}>
              <Card class="p-4">
                <div class="flex items-center gap-2 text-muted-foreground mb-3">
                  <Tag size={14} />
                  <span class="text-xs">Tags</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  {p().tags!.map((tag) => (
                    <Badge variant="outline">{tag}</Badge>
                  ))}
                </div>
              </Card>
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}
