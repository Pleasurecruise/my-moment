import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import { Button } from "./Button";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Tooltip>
      <TooltipTrigger as={Button} variant="outline">
        Hover me
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithDelay: Story = {
  args: {},
  render: () => (
    <Tooltip openDelay={500}>
      <TooltipTrigger as={Button} variant="outline">
        Hover (500ms delay)
      </TooltipTrigger>
      <TooltipContent>
        <p>This tooltip has a 500ms delay</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const MultipleTooltips: Story = {
  args: {},
  render: () => (
    <div class="flex gap-2">
      <Tooltip>
        <TooltipTrigger as={Button} variant="outline" size="icon">
          📁
        </TooltipTrigger>
        <TooltipContent>
          <p>Files</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as={Button} variant="outline" size="icon">
          ⚙️
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as={Button} variant="outline" size="icon">
          🔔
        </TooltipTrigger>
        <TooltipContent>
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};
