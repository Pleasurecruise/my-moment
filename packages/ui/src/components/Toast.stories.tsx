import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Toaster, toast } from "./Toast";
import { Button } from "./Button";

const meta = {
  title: "UI/Toast",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <div>
      <Toaster />
      <div class="flex flex-wrap gap-2">
        <Button onClick={() => toast.show({ title: "Event has been created" })}>Default</Button>
        <Button onClick={() => toast.success("Success!", "Your changes have been saved.")}>
          Success
        </Button>
        <Button onClick={() => toast.error("Error!", "Something went wrong.")}>Error</Button>
        <Button onClick={() => toast.warning("Warning!", "Please check your input.")}>
          Warning
        </Button>
        <Button onClick={() => toast.info("Info", "This is an informational message.")}>
          Info
        </Button>
      </div>
    </div>
  ),
};

export const WithAction: Story = {
  args: {},
  render: () => (
    <div>
      <Toaster />
      <Button
        onClick={() =>
          toast.show({
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
            variant: "error",
            action: {
              label: "Try again",
              onClick: () => alert("Retried!"),
            },
          })
        }
      >
        Show with Action
      </Button>
    </div>
  ),
};

export const SimpleToast: Story = {
  args: {},
  render: () => (
    <div>
      <Toaster />
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast.show({ title: "Simple toast" })}>
          Simple
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.show({
              title: "With description",
              description: "This is a more detailed description.",
            })
          }
        >
          With Description
        </Button>
      </div>
    </div>
  ),
};
