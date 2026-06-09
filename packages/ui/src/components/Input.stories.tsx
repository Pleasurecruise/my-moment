import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Input } from "./Input";

const meta = {
  title: "UI/Input",
  component: Input,
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    type: { control: "select", options: ["text", "email", "password", "number"] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};

export const Email: Story = {
  args: { type: "email", placeholder: "email@example.com" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password" },
};
