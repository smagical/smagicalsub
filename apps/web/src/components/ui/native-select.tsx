import { Children, isValidElement } from "react";
import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

const emptyValue = "__smagicalsub_empty_select_value__";

export function NativeSelect({
  "aria-label": ariaLabel,
  children,
  className,
  defaultValue,
  disabled,
  id,
  name,
  onChange,
  required,
  value
}: ComponentProps<"select">) {
  const options = optionChildren(children);
  const selectedValue = normalizeValue(value ?? defaultValue ?? options[0]?.value ?? "");

  function handleChange(nextValue: string) {
    const nativeValue = denormalizeValue(nextValue);

    onChange?.({
      currentTarget: { value: nativeValue },
      target: { value: nativeValue }
    } as ChangeEvent<HTMLSelectElement>);
  }

  return (
    <Select
      defaultValue={value === undefined ? selectedValue : undefined}
      disabled={disabled}
      name={name}
      required={required}
      value={value === undefined ? undefined : normalizeValue(value)}
      onValueChange={handleChange}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-full bg-background", className)}
        id={id}
        size="default"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem disabled={option.disabled} key={`${option.value}-${option.label}`} value={normalizeValue(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function optionChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<ComponentProps<"option">>(child) || child.type !== "option") {
      return [];
    }

    const label = nodeText(child.props.children);
    const value = child.props.value === undefined ? label : String(child.props.value);

    return [{ disabled: child.props.disabled, label, value }];
  });
}

function nodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(nodeText).join("");
  }

  return "";
}

function normalizeValue(value: unknown) {
  const normalized = String(value ?? "");
  return normalized === "" ? emptyValue : normalized;
}

function denormalizeValue(value: string) {
  return value === emptyValue ? "" : value;
}
