import { createSignal, createContext, useContext, type ParentProps, type Accessor } from "solid-js";
import type { GallerySettings } from "~/types/gallery";
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
    <GallerySettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {props.children}
    </GallerySettingsContext.Provider>
  );
}

export function useGallerySettings() {
  const context = useContext(GallerySettingsContext);
  if (!context) {
    throw new Error("useGallerySettings must be used within GallerySettingsProvider");
  }
  return context;
}
