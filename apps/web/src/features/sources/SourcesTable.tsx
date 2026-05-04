import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { SourceDto } from "@smagicalsub/shared";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { FilterField } from "../../shared/FilterField";
import { StatusBadge } from "../../shared/StatusBadge";
import { SourceActions } from "./SourceActions";
import { normalizedInterval, refreshIntervalOptions } from "./SourceForm";
import type { SourceEditFormState } from "./types";

type SourcesTableProps = {
  editForm: SourceEditFormState;
  editingSourceId: string | null;
  pending: boolean;
  sources: SourceDto[];
  onCancelEdit: () => void;
  onDelete: (source: SourceDto) => void;
  onEditFormChange: (form: SourceEditFormState) => void;
  onRefresh: (id: string) => void;
  onSaveEdit: (source: SourceDto) => void;
  onStartEdit: (source: SourceDto) => void;
  onToggleEnabled: (source: SourceDto) => void;
};

export function SourcesTable({
  editForm,
  editingSourceId,
  pending,
  sources,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onRefresh,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: SourcesTableProps) {
  const editingSource = sources.find((source) => source.id === editingSourceId) ?? null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5" aria-label="订阅源列表">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            pending={pending}
            source={source}
            onDelete={onDelete}
            onRefresh={onRefresh}
            onStartEdit={onStartEdit}
            onToggleEnabled={onToggleEnabled}
          />
        ))}
      </div>

      <SourceEditDialog
        editForm={editForm}
        pending={pending}
        source={editingSource}
        onCancelEdit={onCancelEdit}
        onEditFormChange={onEditFormChange}
        onSaveEdit={onSaveEdit}
      />
    </>
  );
}

function SourceCard({
  pending,
  source,
  onDelete,
  onRefresh,
  onStartEdit,
  onToggleEnabled
}: {
  pending: boolean;
  source: SourceDto;
  onDelete: (source: SourceDto) => void;
  onRefresh: (id: string) => void;
  onStartEdit: (source: SourceDto) => void;
  onToggleEnabled: (source: SourceDto) => void;
}) {
  return (
    <Card className={cn("h-full gap-2 border-l-[4px]", source.enabled ? "border-l-chart-3" : "border-l-muted-foreground/30")} size="sm">
      <CardHeader className="gap-0">
        <div className="min-w-0">
          <CardTitle className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 max-w-[42%] truncate">{source.name}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-normal text-muted-foreground" title={source.url}>
              {source.url}
            </span>
          </CardTitle>
        </div>
        <CardAction className="row-span-1">
          <StatusBadge enabled={source.enabled} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2">
        {/* 订阅源卡片以低高度为目标：状态信息和操作按钮压在同一行。 */}
        <div className="grid grid-cols-[minmax(94px,0.65fr)_minmax(92px,0.65fr)_minmax(72px,0.5fr)_minmax(108px,0.8fr)_minmax(126px,1fr)_104px] gap-2 max-[760px]:grid-cols-2 max-[420px]:grid-cols-1">
          <SourceStat label="定时刷新">{refreshScheduleBadge(source)}</SourceStat>
          <SourceStat label="默认分组">
            <SourceGroups groups={source.groups} />
          </SourceStat>
          <SourceStat label="刷新状态">{refreshBadge(source.last_status)}</SourceStat>
          <SourceStat label="最近刷新">
            <span className="font-mono text-xs">{source.last_fetched_at ?? "未刷新"}</span>
          </SourceStat>
          <SourceStat label="拉取结果" tone={source.last_error ? "danger" : "default"}>
            <FetchResultLines source={source} />
          </SourceStat>
          <SourceActions
            className="grid w-full grid-cols-2 gap-1.5 max-[760px]:col-span-2 max-[420px]:col-span-1"
            compact
            pending={pending}
            source={source}
            onDelete={onDelete}
            onRefresh={onRefresh}
            onStartEdit={onStartEdit}
            onToggleEnabled={onToggleEnabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SourceGroups({ groups }: { groups: string[] }) {
  if (groups.length === 0) {
    return <Badge variant="secondary">默认</Badge>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {groups.slice(0, 2).map((group) => (
        <Badge className="max-w-full truncate" key={group} variant="outline">
          {group}
        </Badge>
      ))}
      {groups.length > 2 ? <Badge variant="secondary">+{groups.length - 2}</Badge> : null}
    </div>
  );
}

function SourceStat({ children, label, tone = "default" }: { children: ReactNode; label: string; tone?: "danger" | "default" }) {
  return (
    <div
      className={cn(
        "grid min-w-0 content-start gap-1 rounded-lg border px-2 py-1.5",
        tone === "danger" ? "border-destructive/30 bg-destructive/10" : "bg-muted/20"
      )}
    >
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function FetchResultLines({ source }: { source: SourceDto }) {
  const lines = latestFetchLines(source);

  return (
    <div className="grid max-h-8 gap-0.5 overflow-hidden">
      {lines.map((line, index) => (
        <span
          className={cn("truncate text-xs", source.last_error ? "text-destructive" : "text-muted-foreground")}
          key={`${index}-${line}`}
          title={line}
        >
          {line}
        </span>
      ))}
    </div>
  );
}

function SourceEditDialog({
  editForm,
  pending,
  source,
  onCancelEdit,
  onEditFormChange,
  onSaveEdit
}: {
  editForm: SourceEditFormState;
  pending: boolean;
  source: SourceDto | null;
  onCancelEdit: () => void;
  onEditFormChange: (form: SourceEditFormState) => void;
  onSaveEdit: (source: SourceDto) => void;
}) {
  return (
    <Dialog open={Boolean(source)} onOpenChange={(open) => (!open ? onCancelEdit() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑订阅源</DialogTitle>
          <DialogDescription>修改订阅源名称、链接和自动刷新频率。</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,0.55fr)] gap-3 max-[560px]:grid-cols-1">
            <FilterField className="min-w-0" label="名称">
              <Input
                aria-label="订阅源名称"
                disabled={pending}
                onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                type="text"
                value={editForm.name}
              />
            </FilterField>
            <FilterField className="min-w-0" label="定时刷新">
              <NativeSelect
                aria-label="定时刷新"
                disabled={pending}
                onChange={(event) => onEditFormChange({ ...editForm, refresh_interval_minutes: event.target.value })}
                value={editForm.refresh_interval_minutes}
              >
                {refreshIntervalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </FilterField>
          </div>
          <FilterField className="min-w-0" label="默认分组">
            <Input
              aria-label="订阅源默认分组"
              disabled={pending}
              onChange={(event) => onEditFormChange({ ...editForm, groups: event.target.value })}
              placeholder="Proxy,Media"
              type="text"
              value={editForm.groups}
            />
          </FilterField>
          <FilterField className="min-w-0" label="订阅链接">
            <Input
              aria-label="订阅源链接"
              disabled={pending}
              onChange={(event) => onEditFormChange({ ...editForm, url: event.target.value })}
              type="url"
              value={editForm.url}
            />
          </FilterField>
        </DialogBody>
        <DialogFooter>
          <Button disabled={pending} onClick={onCancelEdit} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending || !source} onClick={() => (source ? onSaveEdit(source) : undefined)} type="button" variant="info">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function refreshBadge(status: string | null) {
  if (status === "success") {
    return (
      <Badge className="border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
        成功
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge className="border-destructive/30 bg-destructive/10 text-destructive" variant="outline">
        失败
      </Badge>
    );
  }

  return <Badge variant="outline">未刷新</Badge>;
}

function refreshScheduleBadge(source: SourceDto) {
  const minutes = source.refresh_interval_minutes ?? 0;

  if (minutes <= 0) {
    return <Badge variant="outline">手动刷新</Badge>;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Badge className="w-fit border-primary/30 bg-primary/10 text-primary" variant="outline">
        {formatRefreshInterval(minutes)}
      </Badge>
      <span className="truncate font-mono text-[11px] text-muted-foreground" title={source.next_refresh_at ?? "等待计算"}>
        {source.next_refresh_at ?? "等待计算"}
      </span>
    </div>
  );
}

function formatRefreshInterval(minutes: number) {
  const configured = refreshIntervalOptions.find((option) => normalizedInterval(option.value) === minutes);
  return configured ? configured.label : `每 ${minutes} 分钟`;
}

function latestFetchLines(source: SourceDto) {
  if (source.last_error) {
    const latestErrors = source.last_error
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-2);

    return latestErrors.length > 0 ? latestErrors : ["拉取失败，无错误详情"];
  }

  if (source.last_status === "success") {
    return [source.last_fetched_at ? `最近成功：${source.last_fetched_at}` : "最近成功"];
  }

  return ["暂无拉取记录"];
}
