import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileRuleFormat } from "@smagicalsub/shared";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import type { ProfileRuleFormState } from "./types";
import {
  buildProfileRule,
  parseProfileRule,
  parseRuleContent,
  profileRuleFormats,
  profileRulePresets,
  profileRuleKinds,
  profileRuleTemplates,
  type ProfileRuleKind,
  type StructuredProfileRule,
  toCreateProfileRuleInput
} from "./utils";

const policyOptions = [
  { label: "Proxy（默认代理）", value: "Proxy" },
  { label: "DIRECT（直连）", value: "DIRECT" },
  { label: "REJECT（拦截）", value: "REJECT" }
] as const;

type PolicyValue = (typeof policyOptions)[number]["value"];
type PolicyMode = "select" | "custom";

type ProfileRuleFormProps = {
  form: ProfileRuleFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<ProfileRuleFormState>>;
  onApplyPreset: (rules: readonly string[]) => void;
  onSubmit: (value: ReturnType<typeof toCreateProfileRuleInput>) => void;
};

export function ProfileRuleForm({ form, pending, setForm, onApplyPreset, onSubmit }: ProfileRuleFormProps) {
  const structuredRule = parseProfileRule(form.rule);
  const ruleKind = profileRuleKinds.find((item) => item.value === structuredRule.kind) ?? profileRuleKinds[0];
  const [policyMode, setPolicyMode] = useState<PolicyMode>(() => (isPolicyOption(structuredRule.policy) ? "select" : "custom"));
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyValue>(() => (isPolicyOption(structuredRule.policy) ? structuredRule.policy : "Proxy"));

  useEffect(() => {
    if (!isPolicyOption(structuredRule.policy)) {
      setPolicyMode("custom");
    }
  }, [structuredRule.policy]);

  useEffect(() => {
    if (policyMode === "select" && isPolicyOption(structuredRule.policy)) {
      setSelectedPolicy(structuredRule.policy);
    }
  }, [policyMode, structuredRule.policy]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateProfileRuleInput(form));
  }

  function updateRule(patch: Partial<StructuredProfileRule>) {
    setForm((current) => ({ ...current, rule: buildProfileRule({ ...structuredRule, ...patch }) }));
  }

  function updatePolicyMode(checked: boolean) {
    if (checked) {
      setPolicyMode("custom");
      return;
    }

    setPolicyMode("select");
    updateRule({ policy: selectedPolicy });
  }

  function updateFormat(format: ProfileRuleFormat) {
    setForm((current) => {
      const nextContent = format === "common" || format === "clash" ? "{}" : current.content;
      const nextRule = format === "common" ? current.rule : defaultNativeRule(format, current.rule);

      return { ...current, content: nextContent, format, rule: nextRule };
    });
  }

  function updateNativeRule(value: string) {
    setForm((current) => ({ ...current, content: value, rule: compactJsonText(value) }));
  }

  const selectedFormat = profileRuleFormats.find((item) => item.value === form.format) ?? profileRuleFormats[0];
  const contentInvalid = form.format !== "common" && form.format !== "clash" && !isJsonObjectText(form.content);

  return (
    <div className="rounded-lg border bg-card/70 p-3">
      <div className="mb-3 grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-muted-foreground">规则格式</span>
          <span className="text-[11px] text-muted-foreground">{selectedFormat.description}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {profileRuleFormats.map((item) => (
            <Button
              className="h-auto min-h-12 flex-col items-start gap-1 px-2.5 py-2 text-left"
              disabled={pending}
              key={item.value}
              onClick={() => updateFormat(item.value)}
              size="sm"
              type="button"
              variant={form.format === item.value ? "info" : "outline"}
            >
              <span>{item.label}</span>
              <span className="line-clamp-1 text-[11px] font-normal opacity-80">{item.description}</span>
            </Button>
          ))}
        </div>
      </div>
      {form.format === "common" ? (
        <>
          <div className="mb-3 rounded-lg border bg-muted/25 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground">预设模板</span>
              <span className="font-mono text-[11px] text-muted-foreground">routing presets</span>
            </div>
            <div className="grid gap-2 lg:grid-cols-3">
              {profileRulePresets.map((preset) => (
                <Button
                  className="h-auto min-h-14 flex-col items-start gap-1 px-2.5 py-2 text-left"
                  disabled={pending}
                  key={preset.label}
                  onClick={() => onApplyPreset(preset.rules)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <span>{preset.label}</span>
                  <span className="line-clamp-2 text-[11px] font-normal text-muted-foreground">{preset.description}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground">常用模板</span>
              <span className="font-mono text-[11px] text-muted-foreground">routing rule</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profileRuleTemplates.map((template) => (
                <Button
                  className="h-auto justify-start gap-1.5 px-2 py-1"
                  disabled={pending}
                  key={template.label}
                  onClick={() => setForm((current) => ({ ...current, rule: template.value }))}
                  size="xs"
                  title={template.value}
                  type="button"
                  variant="outline"
                >
                  <span>{template.label}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{template.sample}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="mb-3 grid gap-3 border-t pt-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <FilterField className="min-w-0" label="规则类型">
                <NativeSelect
                  disabled={pending}
                  onChange={(event) => updateRule({ kind: event.target.value as ProfileRuleKind })}
                  value={structuredRule.kind}
                >
                  {profileRuleKinds.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </NativeSelect>
              </FilterField>
              <div className="grid min-w-0 gap-1.5">
                <div className="flex min-h-5 items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">策略</span>
                  <label className="inline-flex items-center gap-1.5 rounded-md border bg-background/60 px-2 py-0.5">
                    <Checkbox
                      aria-label="自定义策略"
                      checked={policyMode === "custom"}
                      disabled={pending}
                      onCheckedChange={(checked) => updatePolicyMode(checked === true)}
                    />
                    <span className="text-xs font-semibold text-muted-foreground">自定义</span>
                  </label>
                </div>
                {policyMode === "custom" ? (
                  <Input
                    aria-label="自定义策略值"
                    disabled={pending}
                    onChange={(event) => updateRule({ policy: event.target.value })}
                    placeholder="Proxy / Media / MyGroup"
                    type="text"
                    value={structuredRule.policy}
                  />
                ) : (
                  <NativeSelect
                    aria-label="策略"
                    disabled={pending}
                    onChange={(event) => {
                      const value = event.target.value as PolicyValue;
                      setPolicyMode("select");
                      setSelectedPolicy(value);
                      updateRule({ policy: value });
                    }}
                    value={selectedPolicy}
                  >
                    {policyOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </div>
            </div>
            {structuredRule.kind !== "MATCH" ? (
              <FilterField className="min-w-0" label="匹配值">
                <Input
                  disabled={pending}
                  onChange={(event) => updateRule({ target: event.target.value })}
                  placeholder={ruleKind.placeholder}
                  type="text"
                  value={structuredRule.target}
                />
              </FilterField>
            ) : (
              <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                MATCH 类型不需要匹配值，直接保存后会作为兜底规则。
              </div>
            )}
          </div>
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <FilterField className="min-w-0" label="规则">
                <Textarea
                  className="min-h-20 font-mono text-xs leading-5"
                  onChange={(event) => setForm((current) => ({ ...current, rule: event.target.value }))}
                  placeholder="DOMAIN-SUFFIX,example.com,Proxy"
                  required
                  value={form.rule}
                />
              </FilterField>
              <p className="px-0.5 text-[11px] text-muted-foreground">
                规则是输出给客户端的匹配语句。MATCH 写成“MATCH,策略”，其他类型一般是“类型,匹配值,策略”。
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <FilterField className="min-w-[160px] flex-1" label="排序">
                <Input
                  min={0}
                  onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
                  placeholder="自动"
                  type="number"
                  value={form.position}
                />
              </FilterField>
              <div className="flex min-h-10 items-center rounded-md border bg-background/60 px-3">
                <CheckboxField
                  checked={form.enabled}
                  label="启用"
                  onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
                />
              </div>
              <Button className="min-h-10 min-w-24 whitespace-nowrap" disabled={pending} type="submit">
                添加规则
              </Button>
            </div>
          </form>
        </>
      ) : (
        <form className="grid gap-3" onSubmit={handleSubmit}>
          {form.format === "clash" ? (
            <div className="grid gap-1.5">
              <FilterField className="min-w-0" label="Clash 原生规则">
                <Textarea
                  className="min-h-24 font-mono text-xs leading-5"
                  disabled={pending}
                  onChange={(event) => setForm((current) => ({ ...current, rule: event.target.value }))}
                  placeholder="DOMAIN-SUFFIX,example.com,Proxy"
                  required
                  value={form.rule}
                />
              </FilterField>
              <p className="px-0.5 text-[11px] text-muted-foreground">Clash/Mihomo 原生规则会直接写入 rules 列表，不参与 sing-box 或 Xray 输出。</p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <FilterField className="min-w-0" label={`${selectedFormat.label} JSON 规则`}>
                <Textarea
                  aria-invalid={contentInvalid}
                  className="min-h-36 font-mono text-xs leading-5"
                  disabled={pending}
                  onChange={(event) => updateNativeRule(event.target.value)}
                  placeholder={form.format === "sing-box" ? '{ "domain_suffix": ["example.com"], "action": "route", "outbound": "Proxy" }' : '{ "type": "field", "domain": ["domain:example.com"], "outboundTag": "direct" }'}
                  required
                  value={form.content}
                />
              </FilterField>
              <p className="px-0.5 text-[11px] text-muted-foreground">
                {contentInvalid ? "请输入合法 JSON 对象。" : "原生 JSON 会写入对应客户端的路由规则，适合无法通用转换的高级规则。"}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <FilterField className="min-w-[160px] flex-1" label="排序">
              <Input
                disabled={pending}
                min={0}
                onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
                placeholder="自动"
                type="number"
                value={form.position}
              />
            </FilterField>
            <div className="flex min-h-10 items-center rounded-md border bg-background/60 px-3">
              <CheckboxField
                checked={form.enabled}
                label="启用"
                onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
              />
            </div>
            <Button className="min-h-10 min-w-24 whitespace-nowrap" disabled={pending || contentInvalid} type="submit">
              添加规则
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function isPolicyOption(policy: string): policy is PolicyValue {
  return policyOptions.some((item) => item.value === policy);
}

function defaultNativeRule(format: ProfileRuleFormat, currentRule: string) {
  if (format === "clash") {
    return currentRule || "DOMAIN-SUFFIX,example.com,Proxy";
  }

  if (format === "sing-box") {
    return JSON.stringify({ action: "route", domain_suffix: ["example.com"], outbound: "Proxy" }, null, 2);
  }

  if (format === "xray") {
    return JSON.stringify({ domain: ["domain:example.com"], outboundTag: "direct", type: "field" }, null, 2);
  }

  return currentRule;
}

function compactJsonText(value: string) {
  try {
    return JSON.stringify(parseRuleContent(value));
  } catch {
    return value.trim();
  }
}

function isJsonObjectText(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Boolean(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  } catch {
    return false;
  }
}
