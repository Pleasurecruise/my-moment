import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Tag } from "./Tag";

const meta = {
  title: "UI/Tag",
  component: Tag,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "secondary", "destructive", "outline"],
    },
    removable: { control: "boolean" },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Tag",
  },
};

export const Secondary: Story = {
  args: {
    children: "Tag",
    variant: "secondary",
  },
};

export const Destructive: Story = {
  args: {
    children: "Tag",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Tag",
    variant: "outline",
  },
};

export const Removable: Story = {
  args: {
    children: "Removable",
    removable: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div class="flex flex-wrap gap-2">
      <Tag variant="default">Default</Tag>
      <Tag variant="secondary">Secondary</Tag>
      <Tag variant="destructive">Destructive</Tag>
      <Tag variant="outline">Outline</Tag>
    </div>
  ),
};

export const WithRemoval: Story = {
  render: () => (
    <div class="flex flex-wrap gap-2">
      <Tag variant="default" removable onRemove={() => alert("Removed!")}>
        React
      </Tag>
      <Tag variant="secondary" removable onRemove={() => alert("Removed!")}>
        Solid
      </Tag>
      <Tag variant="outline" removable onRemove={() => alert("Removed!")}>
        Vue
      </Tag>
    </div>
  ),
};
