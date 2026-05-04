import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { NodeDto, ProfileDto } from "@smagicalsub/shared";
import { CheckCircle2, KeyRound, Link2, Plus, Route } from "lucide-react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { TokenNodeSelector } from "./TokenNodeSelector";
import type { TokenFormState } from "./types";
import { toCreateTokenInput } from "./utils";

type TokenFormProps = {
  form: TokenFormState;
  nodes: NodeDto[];
  pending: boolean;
  profiles: ProfileDto[];
  setForm: Dispatch<SetStateAction<TokenFormState>>;
  onSubmit: (value: ReturnType<typeof toCreateTokenInput>) => void;
};

export function TokenForm({ form, nodes, pending, profiles, setForm, onSubmit }: TokenFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateTokenInput(form));
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-start justify-between gap-3 border-b pb-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-chart-2">
              <KeyRound />
              令牌基础
            </div>
            <p className="text-xs text-muted-foreground">控制订阅的名称、绑定配置档、过期时间和可见状态。</p>
          </div>
          <Badge className={form.enabled ? "border-chart-3/30 bg-chart-3/10 text-chart-3" : "border-destructive/30 bg-destructive/10 text-destructive"} variant="outline">
            {form.enabled ? "启用中" : "已停用"}
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-1">
          <FilterField label="名称">
            <Input
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="默认订阅"
              required
              type="text"
              value={form.name}
            />
          </FilterField>
          <FilterField label="配置档">
            <NativeSelect
              onChange={(event) => setForm((current) => ({ ...current, profile_id: event.target.value }))}
              value={form.profile_id}
            >
              <option value="">不绑定</option>
              {profiles.map((profile) => (
                <option disabled={!profile.enabled} key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
          <FilterField label="过期时间">
            <Input
              onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))}
              type="datetime-local"
              value={form.expires_at}
            />
          </FilterField>
          <div className="flex flex-col justify-end gap-3 rounded-lg border bg-muted/30 p-3">
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 text-chart-3" />
              启用后可立即被订阅地址访问；停用后请求会被拒绝。
            </p>
            <CheckboxField
              checked={form.enabled}
              label="启用"
              onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
            />
            <Button className="w-full" disabled={pending} type="submit" variant="info">
              <Plus data-icon="inline-start" />
              创建令牌
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Route />
              范围与路径
            </div>
            <p className="text-xs text-muted-foreground">自定义路径会覆盖默认地址；节点范围为空时输出全部启用节点。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{nodeScopeLabel(form.node_ids)}</Badge>
            <Badge variant={form.custom_path.trim() ? "secondary" : "outline"}>
              <Link2 />
              {pathPreview(form.custom_path)}
            </Badge>
          </div>
        </div>
        <div className="grid gap-3">
          <FilterField className="self-start" label="自定义路径">
            <Input
              onChange={(event) => setForm((current) => ({ ...current, custom_path: event.target.value }))}
              placeholder="my-sub"
              type="text"
              value={form.custom_path}
            />
          </FilterField>
          <FilterField className="self-start" label="订阅节点">
            <TokenNodeSelector
              nodes={nodes}
              selectedIds={form.node_ids}
              onChange={(node_ids) => setForm((current) => ({ ...current, node_ids }))}
            />
          </FilterField>
        </div>
      </div>
    </form>
  );
}

function nodeScopeLabel(nodeIds: string[]) {
  return nodeIds.length === 0 ? "全部节点" : `${nodeIds.length} 个节点`;
}

function pathPreview(customPath: string) {
  const value = customPath.trim();
  return value ? `/sub/${value}` : "自动路径";
}
