import type { MusicResponse } from "~/types";

interface SpotifyOEmbed {
  title?: string;
  thumbnail_url?: string;
  iframe_url?: string;
}

export async function getSpotifyMusic(playlistId: string): Promise<MusicResponse> {
  const spotifyUrl = `https://open.spotify.com/playlist/${playlistId}`;
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;

  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new Error(`Spotify oEmbed request failed (${response.status})`);
  }

  const data = (await response.json()) as SpotifyOEmbed;

  return {
    name: data.title ?? "Playlist",
    coverUrl: data.thumbnail_url,
    spotifyUrl,
    iframeUrl: data.iframe_url ?? `https://open.spotify.com/embed/playlist/${playlistId}`,
  };
}
