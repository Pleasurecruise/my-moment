import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Separator } from "./Separator";

const meta = {
  title: "UI/Separator",
  component: Separator,
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
  },
  render: (args) => (
    <div>
      <div class="space-y-1">
        <h4 class="text-sm font-medium">My Moment</h4>
        <p class="text-sm text-muted-foreground">A photo gallery and haul tracker.</p>
      </div>
      <Separator {...args} class="my-4" />
      <div class="flex h-5 items-center space-x-4 text-sm">
        <div>Gallery</div>
        <Separator orientation="vertical" />
        <div>Haul</div>
        <Separator orientation="vertical" />
        <div>Upload</div>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <div class="flex h-5 items-center space-x-4 text-sm">
      <div>Gallery</div>
      <Separator {...args} />
      <div>Haul</div>
      <Separator {...args} />
      <div>Upload</div>
    </div>
  ),
};
