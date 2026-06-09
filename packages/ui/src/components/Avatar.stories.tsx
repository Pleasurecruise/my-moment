import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Avatar } from "./Avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "default", "lg"],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    src: "https://github.com/shadcn.png",
    alt: "Avatar",
    size: "default",
  },
};

export const Fallback: Story = {
  args: {
    fallback: "JD",
    size: "default",
  },
};

export const Small: Story = {
  args: {
    fallback: "A",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    fallback: "MK",
    size: "lg",
  },
};
