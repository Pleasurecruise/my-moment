import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { TagInput } from "./TagInput";
import { createSignal } from "solid-js";

const meta = {
  title: "UI/TagInput",
  component: TagInput,
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
    maxTags: { control: "number" },
    tagVariant: {
      control: { type: "select" },
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Add tags...",
  },
  render: (args) => {
    const [tags, setTags] = createSignal<string[]>([]);
    return <TagInput {...args} value={tags()} onChange={setTags} />;
  },
};

export const WithInitialTags: Story = {
  args: {
    placeholder: "Add tags...",
  },
  render: (args) => {
    const [tags, setTags] = createSignal<string[]>(["react", "solid", "vue"]);
    return <TagInput {...args} value={tags()} onChange={setTags} />;
  },
};

export const MaxTags: Story = {
  args: {
    placeholder: "Add up to 3 tags...",
    maxTags: 3,
  },
  render: (args) => {
    const [tags, setTags] = createSignal<string[]>([]);
    return <TagInput {...args} value={tags()} onChange={setTags} />;
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Add tags...",
    disabled: true,
  },
  render: (args) => {
    const [tags, setTags] = createSignal<string[]>(["react", "solid"]);
    return <TagInput {...args} value={tags()} onChange={setTags} />;
  },
};

export const WithError: Story = {
  args: {
    placeholder: "Add tags...",
    error: true,
  },
  render: (args) => {
    const [tags, setTags] = createSignal<string[]>([]);
    return <TagInput {...args} value={tags()} onChange={setTags} />;
  },
};

export const TagVariants: Story = {
  render: () => {
    const [tags1, setTags1] = createSignal<string[]>(["react", "solid"]);
    const [tags2, setTags2] = createSignal<string[]>(["react", "solid"]);
    const [tags3, setTags3] = createSignal<string[]>(["react", "solid"]);
    const [tags4, setTags4] = createSignal<string[]>(["react", "solid"]);

    return (
      <div class="space-y-4">
        <div>
          <p class="text-sm font-medium mb-2">Default</p>
          <TagInput value={tags1()} onChange={setTags1} tagVariant="default" />
        </div>
        <div>
          <p class="text-sm font-medium mb-2">Secondary</p>
          <TagInput value={tags2()} onChange={setTags2} tagVariant="secondary" />
        </div>
        <div>
          <p class="text-sm font-medium mb-2">Destructive</p>
          <TagInput value={tags3()} onChange={setTags3} tagVariant="destructive" />
        </div>
        <div>
          <p class="text-sm font-medium mb-2">Outline</p>
          <TagInput value={tags4()} onChange={setTags4} tagVariant="outline" />
        </div>
      </div>
    );
  },
};
