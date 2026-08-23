import { createSignal, createContext, useContext, type ParentProps, type Accessor } from "solid-js";
import type { GallerySettings } from "~/types";
import { DEFAULT_GALLERY_SETTINGS } from "~/types/gallery";

const GallerySettingsContext = createContext<{
  settings: Accessor<GallerySettings>;
  updateSettings: (updates: Partial<GallerySettings>) => void;
  resetSettings: () => void;
}>();

export function GallerySettingsProvider(props: ParentProps) {
  const [settings, setSettings] = createSignal<GallerySettings>({ ...DEFAULT_GALLERY_SETTINGS });

  const updateSettings = (updates: Partial<GallerySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_GALLERY_SETTINGS });
  };

  return (
    <GallerySettingsContext value={{ settings, updateSettings, resetSettings }}>
      {props.children}
    </GallerySettingsContext>
  );
}

export function useGallerySettings() {
  return useContext(GallerySettingsContext);
}
