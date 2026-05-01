import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type CheckboxFieldProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

export function CheckboxField({ checked, disabled = false, label, onCheckedChange }: CheckboxFieldProps) {
  const id = useId();

  return (
    <div className="checkbox-field">
      <Checkbox
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
