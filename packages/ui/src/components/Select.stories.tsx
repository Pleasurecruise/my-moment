import type { Meta, StoryObj } from "storybook-solidjs-vite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSection,
  SelectTrigger,
  SelectValue,
} from "./Select";

const fruits = ["Apple", "Banana", "Blueberry", "Grapes", "Pineapple"];

interface FoodOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface FoodGroup {
  label: string;
  items: FoodOption[];
}

const foodGroups: FoodGroup[] = [
  {
    label: "Fruits",
    items: fruits.slice(0, 3).map((label) => ({ label, value: label.toLowerCase() })),
  },
  {
    label: "Vegetables",
    items: ["Carrot", "Broccoli", "Spinach"].map((label) => ({
      label,
      value: label.toLowerCase(),
    })),
  },
];

const meta = {
  title: "UI/Select",
  component: Select,
  args: {
    options: [],
  },
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select<string>
      options={fruits}
      placeholder="Select a fruit"
      itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
    >
      <SelectTrigger class="w-[180px]">
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select<FoodOption, FoodGroup>
      options={foodGroups}
      optionValue="value"
      optionTextValue="label"
      optionGroupChildren="items"
      placeholder="Select a food"
      itemComponent={(props) => (
        <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
      )}
      sectionComponent={(props) => <SelectSection>{props.section.rawValue.label}</SelectSection>}
    >
      <SelectTrigger class="w-[200px]">
        <SelectValue<FoodOption>>{(state) => state.selectedOption().label}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select<string>
      disabled
      options={fruits.slice(0, 2)}
      placeholder="Select a fruit"
      itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
    >
      <SelectTrigger class="w-[180px]">
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  ),
};

export const WithDisabledItems: Story = {
  render: () => {
    const options: FoodOption[] = [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
      { label: "Blueberry", value: "blueberry", disabled: true },
      { label: "Grapes", value: "grapes" },
    ];

    return (
      <Select<FoodOption>
        options={options}
        optionValue="value"
        optionTextValue="label"
        optionDisabled="disabled"
        placeholder="Select a fruit"
        itemComponent={(props) => (
          <SelectItem item={props.item}>
            {props.item.rawValue.label}
            {props.item.rawValue.disabled && " (disabled)"}
          </SelectItem>
        )}
      >
        <SelectTrigger class="w-[180px]">
          <SelectValue<FoodOption>>{(state) => state.selectedOption().label}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    );
  },
};
