import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { CreateSubscriptionSourceInput } from "@smagicalsub/shared";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { FormGrid } from "../../shared/FormGrid";
import type { SourceFormState } from "./types";

type SourceFormProps = {
  className?: string;
  form: SourceFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<SourceFormState>>;
  onSubmit: (value: CreateSubscriptionSourceInput) => void;
};

export function SourceForm({ className, form, pending, setForm, onSubmit }: SourceFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      enabled: form.enabled,
      groups: parseSourceGroups(form.groups),
      name: form.name,
      refresh_interval_minutes: normalizedInterval(form.refresh_interval_minutes),
      url: form.url
    });
  }

  return (
    <FormGrid className={className} onSubmit={handleSubmit}>
      <FilterField className="min-w-0" label="名称">
        <Input
          className="truncate"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="我的订阅"
          required
          type="text"
          value={form.name}
        />
      </FilterField>
      <FilterField className="min-w-0" label="订阅链接">
        <Input
          className="truncate"
          onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
          placeholder="https://example.com/sub"
          required
          type="url"
          value={form.url}
        />
      </FilterField>
      <FilterField className="min-w-0" label="默认分组">
        <Input
          className="truncate"
          onChange={(event) => setForm((current) => ({ ...current, groups: event.target.value }))}
          placeholder="Proxy,Media"
          type="text"
          value={form.groups}
        />
      </FilterField>
      <CheckboxField
        checked={form.enabled}
        label="启用"
        onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
      />
      <FilterField className="min-w-0" label="定时刷新">
        <NativeSelect
          className="truncate"
          onChange={(event) => setForm((current) => ({ ...current, refresh_interval_minutes: event.target.value }))}
          value={form.refresh_interval_minutes}
        >
          {refreshIntervalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      <Button className="self-end" disabled={pending} type="submit" variant="info">
        创建
      </Button>
    </FormGrid>
  );
}

export const refreshIntervalOptions = [
  { label: "不自动刷新", value: "0" },
  { label: "每 30 分钟", value: "30" },
  { label: "每 1 小时", value: "60" },
  { label: "每 6 小时", value: "360" },
  { label: "每天", value: "1440" },
  { label: "每周", value: "10080" }
];

export function normalizedInterval(value: string) {
  const minutes = Number(value);
  return Number.isFinite(minutes) ? minutes : 0;
}

export function parseSourceGroups(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((group) => group.trim())
        .filter(Boolean)
    )
  );
}

export function formatSourceGroups(groups: string[]) {
  return groups.join(",");
}
