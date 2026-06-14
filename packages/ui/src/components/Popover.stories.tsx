import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";

const meta = {
  title: "UI/Popover",
  component: Popover,
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger as={Button} variant="outline">
        Open Popover
      </PopoverTrigger>
      <PopoverContent class="w-80">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Dimensions</h4>
            <p class="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
          </div>
          <div class="grid gap-2">
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="width">Width</Label>
              <Input id="width" value="100%" class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="height">Height</Label>
              <Input id="height" value="25px" class="col-span-2 h-8" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Simple: Story = {
  args: {},
  render: () => (
    <Popover>
      <PopoverTrigger as={Button} variant="outline">
        Click me
      </PopoverTrigger>
      <PopoverContent>
        <div class="space-y-2">
          <h4 class="font-medium">Popover Title</h4>
          <p class="text-sm text-muted-foreground">This is a simple popover with some content.</p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
