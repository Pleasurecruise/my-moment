import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Input } from "./Input";
import { Label } from "./Label";

const meta = {
  title: "UI/Input",
  component: Input,
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
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

export const WithError: Story = {
  args: { placeholder: "Error", error: true },
};

export const Email: Story = {
  args: { type: "email", placeholder: "email@example.com" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password" },
};

export const WithLabel: Story = {
  render: () => (
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const WithLabelError: Story = {
  render: () => (
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email" error>
        Email
      </Label>
      <Input type="email" id="email" placeholder="Email" error />
      <p class="text-xs text-destructive">Please enter a valid email.</p>
    </div>
  ),
};
