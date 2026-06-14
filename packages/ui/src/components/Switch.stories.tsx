import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Switch, SwitchControl, SwitchThumb, SwitchLabel, SwitchDescription } from "./Switch";
import { createSignal } from "solid-js";

const meta = {
  title: "UI/Switch",
  component: Switch,
  argTypes: {
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => {
    const [checked, setChecked] = createSignal(false);
    return (
      <Switch checked={checked()} onChange={setChecked}>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>
    );
  },
};

export const WithLabel: Story = {
  args: {},
  render: () => {
    const [checked, setChecked] = createSignal(false);
    return (
      <div class="flex items-center space-x-2">
        <Switch checked={checked()} onChange={setChecked} id="airplane-mode">
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
        <SwitchLabel for="airplane-mode">Airplane Mode</SwitchLabel>
      </div>
    );
  },
};

export const WithDescription: Story = {
  args: {},
  render: () => {
    const [checked, setChecked] = createSignal(false);
    return (
      <Switch checked={checked()} onChange={setChecked}>
        <div class="flex items-center space-x-2">
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <div>
            <SwitchLabel>Marketing emails</SwitchLabel>
            <SwitchDescription>
              Receive emails about new products, features, and more.
            </SwitchDescription>
          </div>
        </div>
      </Switch>
    );
  },
};

export const Disabled: Story = {
  args: {},
  render: () => (
    <Switch disabled>
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
    </Switch>
  ),
};

export const Checked: Story = {
  args: {},
  render: () => (
    <Switch checked>
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
    </Switch>
  ),
};

export const CheckedDisabled: Story = {
  args: {},
  render: () => (
    <Switch checked disabled>
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
    </Switch>
  ),
};
