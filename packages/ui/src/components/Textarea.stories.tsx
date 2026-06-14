import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Textarea } from "./Textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
    autoresize: { control: "boolean" },
    rows: { control: "number" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here.",
  },
};

export const WithValue: Story = {
  args: {
    value: "This is a textarea with some content.",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "This textarea is disabled.",
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    placeholder: "This textarea has an error.",
    error: true,
  },
};

export const Autoresize: Story = {
  args: {
    placeholder: "This textarea will auto-resize as you type...",
    autoresize: true,
  },
};

export const WithRows: Story = {
  args: {
    placeholder: "This textarea has 5 rows.",
    rows: 5,
  },
};
