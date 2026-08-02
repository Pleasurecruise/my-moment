import type { JSX } from "solid-js";
import type { PhotoItem } from "./photo";

export interface PageHeaderProps {
  title: string;
  subtitle?: JSX.Element;
  actions?: JSX.Element;
  controls?: JSX.Element;
  class?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: JSX.Element;
  action?: JSX.Element;
  class?: string;
}

export interface PhotoDetailsProps {
  photo: PhotoItem;
  class?: string;
}

export interface LabelValueProps {
  label: string;
  value: string;
}

export interface ShareLinkOptions {
  url: string;
  title?: string;
  successMessage?: string;
}
