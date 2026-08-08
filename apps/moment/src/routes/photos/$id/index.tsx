import { createFileRoute, Link } from "@tanstack/solid-router";
import { Show } from "solid-js";
import { ArrowLeft, Share2, Edit3 } from "lucide-solid";
import { Button } from "@my-moment/ui";
import { shareLink } from "~/lib/share";
import type { PhotoItem } from "~/types";
import { PhotoDetails } from "~/modules/viewer/PhotoDetails";
import { EmptyState } from "~/components/EmptyState";
import { socialMeta } from "~/lib/seo";

export const Route = createFileRoute("/photos/$id/")({
  component: PhotoDetailPage,
  head: ({ loaderData }) => {
    const photo = loaderData as PhotoItem | null | undefined;
    if (!photo) {
      return {
        meta: [
          { title: "Photo Not Found — My Moment" },
          { name: "robots", content: "noindex, nofollow" },
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
      meta: socialMeta({
        title: `${photo.title || "Untitled moment"} — My Moment`,
        description: description.slice(0, 160),
        path: `/photos/${photo.id}`,
        image: photo.url,
        type: "article",
      }),
    };
  },
  loader: async ({ params }) => {
    const res = await fetch(`/api/photos/${params.id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Could not load photo (${res.status}).`);
    return (await res.json()) as PhotoItem;
  },
});

function PhotoDetailPage() {
  const photo = Route.useLoaderData() as () => PhotoItem | null;
  const params = Route.useParams();

  const handleShare = () =>
    void shareLink({
      url: `${window.location.origin}/photos/${params().id}`,
      title: photo()?.title || "Photo",
      successMessage: "Link copied to clipboard",
    });

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
          <EmptyState
            title="Photo not found"
            description="The photo may have been removed or the link is no longer valid."
          />
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

            <PhotoDetails photo={p()} />
          </div>
        )}
      </Show>
    </div>
  );
}
