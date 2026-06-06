import { createFileRoute } from "@tanstack/solid-router";
import { createResource, For, Show } from "solid-js";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type MomentBootstrap = {
  today: string;
  quote: string;
  metrics: Array<{ label: string; value: string; tone: string }>;
  moments: Array<{ id: string; time: string; title: string; note: string; tag: string }>;
};

async function loadBootstrap(): Promise<MomentBootstrap> {
  const response = await fetch("/api/bootstrap");
  if (!response.ok) {
    throw new Error("Unable to load moment workspace.");
  }
  return response.json();
}

function HomePage() {
  const [data] = createResource(loadBootstrap);

  return (
    <section class="workspace" aria-label="Moment workspace">
      <div class="hero-panel">
        <div class="hero-panel__copy">
          <p class="eyebrow">Private daily memory desk</p>
          <h1>Keep one honest record of today.</h1>
          <p class="lede">
            A compact place for notes, photos, decisions, and the small facts
            that usually vanish before tomorrow notices.
          </p>
          <div class="hero-actions" aria-label="Moment actions">
            <a class="button button--primary" href="#compose">
              New moment
            </a>
            <a class="button button--quiet" href="/api/health">
              API health
            </a>
          </div>
        </div>
        <div class="calendar-slab" aria-label="Today">
          <span class="calendar-slab__label">Today</span>
          <strong>
            <Show when={data()} fallback="Loading">
              {(value) => value().today}
            </Show>
          </strong>
          <p>
            <Show when={data()} fallback="Preparing the desk.">
              {(value) => value().quote}
            </Show>
          </p>
        </div>
      </div>

      <Show when={data()} fallback={<DashboardSkeleton />}>
        {(value) => (
          <div class="dashboard-grid">
            <section class="compose-panel" id="compose" aria-label="Compose moment">
              <div>
                <p class="eyebrow">Capture</p>
                <h2>What is worth keeping?</h2>
              </div>
              <label class="field">
                <span>Title</span>
                <input value="A thought before it runs away" />
              </label>
              <label class="field">
                <span>Moment</span>
                <textarea rows="6">Write the version that future-you will actually understand.</textarea>
              </label>
              <div class="compose-panel__footer">
                <button class="button button--primary" type="button">
                  Save draft
                </button>
                <span>Local draft UI, API boundary ready.</span>
              </div>
            </section>

            <aside class="metrics-panel" aria-label="Today metrics">
              <For each={value().metrics}>
                {(metric) => (
                  <div class="metric">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <small>{metric.tone}</small>
                  </div>
                )}
              </For>
            </aside>

            <section class="timeline-panel" aria-label="Timeline preview">
              <div class="section-heading">
                <div>
                  <p class="eyebrow">Timeline</p>
                  <h2>Recent moments</h2>
                </div>
                <span>{value().moments.length} drafts</span>
              </div>
              <div class="timeline-list">
                <For each={value().moments}>
                  {(moment) => (
                    <article class="moment-row">
                      <time>{moment.time}</time>
                      <div>
                        <span>{moment.tag}</span>
                        <h3>{moment.title}</h3>
                        <p>{moment.note}</p>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </section>
          </div>
        )}
      </Show>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div class="dashboard-grid dashboard-grid--loading">
      <div class="skeleton-block" />
      <div class="skeleton-block skeleton-block--short" />
      <div class="skeleton-block skeleton-block--wide" />
    </div>
  );
}
