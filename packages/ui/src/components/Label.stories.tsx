import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Label } from "./Label";
import { Input } from "./Input";

const meta = {
  title: "UI/Label",
  component: Label,
  argTypes: {
    required: { control: "boolean" },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Email",
  },
};

export const Required: Story = {
  args: {
    children: "Email",
    required: true,
  },
};

export const WithError: Story = {
  args: {
    children: "Email",
    error: true,
  },
};

export const WithInput: Story = {
  render: () => (
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const RequiredWithInput: Story = {
  render: () => (
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email" required>
        Email
      </Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const DisabledWithInput: Story = {
  render: () => (
    <div class="grid w-full max-w-sm items-center gap-1.5">
      <Label for="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" disabled />
    </div>
  ),
};
