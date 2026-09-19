export interface ApiKeyBinding {
  getByName(name: string): { fetch(request: Request): Promise<Response> };
}

export interface WorkerBindings {
  DB: D1Database;
  MOMENT_BUCKET: R2Bucket;
  MOMENT_CACHE: KVNamespace;
  API_KEY: ApiKeyBinding;
  ALLOWED_EMAIL?: string;
  SPOTIFY_PLAYLIST_ID?: string;
  CF_ACCOUNT_ID: string;
  CF_GATEWAY_NAME: string;
  AI_GATEWAY_PROVIDER_SLUG: string;
  OPENAI_API_KEY?: string;
  CF_AIG_TOKEN?: string;
  TAVILY_API_KEY?: string;
  ASSETS: Fetcher;
}

export interface OgSection {
  key: "gallery" | "haul" | "wishlist" | "collection";
  title: string;
  description: string;
}
