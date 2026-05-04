import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import type { NodeDto } from "@smagicalsub/shared";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { StatusBadge } from "../../shared/StatusBadge";
import { NodeActions } from "./NodeActions";
import type { NodeEditFormState } from "./types";

type NodesTableProps = {
  editForm: NodeEditFormState;
  editingNodeId: string | null;
  selectedNodeIds: string[];
  allVisibleSelected: boolean;
  nodes: NodeDto[];
  pending: boolean;
  onCancelEdit: () => void;
  onCopy: (node: NodeDto, value?: string) => Promise<void> | void;
  onDelete: (node: NodeDto) => void;
  onEditFormChange: (form: NodeEditFormState) => void;
  onSaveEdit: (node: NodeDto) => void;
  onStartEdit: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
  onToggleSelected: (nodeId: string, checked: boolean) => void;
  onToggleVisible: (checked: boolean) => void;
};

export function NodesTable({
  editForm,
  editingNodeId,
  selectedNodeIds,
  allVisibleSelected,
  nodes,
  pending,
  onCancelEdit,
  onCopy,
  onDelete,
  onEditFormChange,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled,
  onToggleSelected,
  onToggleVisible
}: NodesTableProps) {
  const editingNode = nodes.find((node) => node.id === editingNodeId) ?? null;

  return (
    <>
      <div className="grid gap-3.5" aria-label="节点列表">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/75 px-3 py-2">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            {selectionInput("选择当前列表节点", allVisibleSelected, pending || nodes.length === 0, onToggleVisible)}
            <span>选择当前列表节点</span>
          </label>
          <Badge variant="outline">当前列表 {nodes.length} 个</Badge>
        </div>
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            pending={pending}
            selected={selectedNodeIds.includes(node.id)}
            onCopy={onCopy}
            onDelete={onDelete}
            onStartEdit={onStartEdit}
            onToggleEnabled={onToggleEnabled}
            onToggleSelected={onToggleSelected}
          />
        ))}
      </div>

      <NodeEditDialog
        editForm={editForm}
        node={editingNode}
        pending={pending}
        onCancelEdit={onCancelEdit}
        onEditFormChange={onEditFormChange}
        onSaveEdit={onSaveEdit}
      />
    </>
  );
}

function NodeCard({
  node,
  pending,
  selected,
  onCopy,
  onDelete,
  onStartEdit,
  onToggleEnabled,
  onToggleSelected
}: {
  node: NodeDto;
  pending: boolean;
  selected: boolean;
  onCopy: (node: NodeDto, value?: string) => Promise<void> | void;
  onDelete: (node: NodeDto) => void;
  onStartEdit: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
  onToggleSelected: (nodeId: string, checked: boolean) => void;
}) {
  const [copyBubble, setCopyBubble] = useState<CopyBubbleState | null>(null);

  const handleCopy = async (value?: string) => {
    await onCopy(node, value);
    setCopyBubble((current) => ({ id: (current?.id ?? 0) + 1, label: "已复制" }));
  };

  return (
    <Card
      aria-label={`节点 ${node.name}`}
      className={cn("relative h-full gap-2 overflow-visible border-l-[4px]", node.enabled ? "border-l-primary" : "border-l-muted-foreground/30")}
      size="sm"
    >
      {copyBubble ? <CopyBubble key={copyBubble.id} bubble={copyBubble} onDone={() => setCopyBubble(null)} /> : null}
      <CardHeader className="gap-0">
        <div className="flex min-w-0 items-start gap-3">
          <div className="pt-0.5">{selectionInput(`选择节点 ${node.name}`, selected, pending, (checked) => onToggleSelected(node.id, checked))}</div>
          <div className="min-w-0">
            <CardTitle className="min-w-0 max-w-[42vw] truncate">{node.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="grid gap-2 lg:grid-cols-[minmax(300px,1.05fr)_minmax(220px,0.75fr)_minmax(148px,0.42fr)]">
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoTile copyValue={node.server ?? ""} label="服务端" title={node.server ?? "-"} value={node.server ?? "-"} onCopy={handleCopy} />
            <InfoTile copyValue={node.port?.toString() ?? ""} label="端口" value={node.port?.toString() ?? "-"} onCopy={handleCopy} />
            <InfoTile
              copyValue={node.groups.join(",")}
              label="分组"
              value={node.groups.length > 0 ? `${node.groups.length} 个` : "默认"}
              onCopy={handleCopy}
            />
            <InfoTile copyValue={node.updated_at} label="更新时间" title={node.updated_at} value={node.updated_at} onCopy={handleCopy} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
            <InfoTile copyValue={node.protocol} label="协议" onCopy={handleCopy}>
              <Badge className={protocolBadgeClass(node.protocol)} variant="outline">
                {node.protocol}
              </Badge>
            </InfoTile>
            <InfoTile copyValue={node.source_id ? "订阅源" : "手动"} label="来源" onCopy={handleCopy}>
              <SourceBadge sourceId={node.source_id} />
            </InfoTile>
            <InfoTile copyValue={node.enabled ? "启用" : "停用"} label="状态" onCopy={handleCopy}>
              <StatusBadge enabled={node.enabled} />
            </InfoTile>
            <InfoTile copyValue={nodeTransportLabel(node)} label="传输" title={nodeTransportLabel(node)} value={nodeTransportLabel(node)} onCopy={handleCopy} />
          </div>

          <NodeActions
            className="grid grid-cols-2 content-start gap-1.5 rounded-lg border bg-muted/20 p-2 [&_[data-slot=button]]:h-7"
            node={node}
            pending={pending}
            onCopy={handleCopy}
            onDelete={onDelete}
            onStartEdit={onStartEdit}
            onToggleEnabled={onToggleEnabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function selectionInput(label: string, checked: boolean, disabled: boolean, onChange: (checked: boolean) => void) {
  return (
    <Checkbox
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onChange(value === true)}
    />
  );
}

function GroupChips({ groups }: { groups: string[] }) {
  if (groups.length === 0) {
    return <Badge variant="secondary">默认</Badge>;
  }

  return (
    <div className="inline-flex flex-wrap gap-1">
      {groups.map((group) => (
        <Badge key={group} variant="outline">
          {group}
        </Badge>
      ))}
    </div>
  );
}

function InfoTile({
  children,
  copyValue,
  label,
  onCopy,
  title,
  value
}: {
  children?: ReactNode;
  copyValue?: string;
  label: string;
  onCopy?: (value: string) => void;
  title?: string;
  value?: string;
}) {
  const canCopy = copyValue !== undefined && copyValue !== "" && onCopy !== undefined;
  const tileClassName =
    "flex min-h-8 min-w-0 items-center justify-start gap-1.5 rounded-lg border bg-muted/20 px-2 py-1.5 text-left";
  const content = (
    <>
      <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{label}</span>
      {children ? (
        <span className="min-w-0">{children}</span>
      ) : (
        <span className="min-w-0 truncate font-mono text-xs" title={title ?? value}>
          {value}
        </span>
      )}
    </>
  );

  if (canCopy) {
    return (
      <button
        aria-label={`复制${label}`}
        className={cn(
          tileClassName,
          "cursor-copy transition-colors hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        )}
        onClick={() => void onCopy(copyValue)}
        title={`点击复制${label}`}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={tileClassName}>
      {content}
    </div>
  );
}

type CopyBubbleState = {
  id: number;
  label: string;
};

function CopyBubble({ bubble, onDone }: { bubble: CopyBubbleState; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute right-3 top-3 rounded-full border border-primary/25 bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-primary/10"
      role="status"
    >
      {bubble.label}
    </div>
  );
}

function NodeEditDialog({
  editForm,
  node,
  pending,
  onCancelEdit,
  onEditFormChange,
  onSaveEdit
}: {
  editForm: NodeEditFormState;
  node: NodeDto | null;
  pending: boolean;
  onCancelEdit: () => void;
  onEditFormChange: (form: NodeEditFormState) => void;
  onSaveEdit: (node: NodeDto) => void;
}) {
  return (
    <Dialog open={Boolean(node)} onOpenChange={(open) => (!open ? onCancelEdit() : undefined)}>
      <DialogContent className="w-[min(94vw,760px)]">
        <DialogHeader>
          <DialogTitle>编辑节点</DialogTitle>
          <DialogDescription>可直接替换节点链接，也可以调整名称、分组和解析后的高级参数。</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[min(64dvh,640px)]">
          <FormSection description="显示名称、分组和启用状态会直接影响订阅输出。" title="基本信息">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 max-[760px]:grid-cols-1">
              <FilterField className="min-w-0" label="显示名称">
                <Input
                  aria-label="节点名称"
                  disabled={pending}
                  onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                  value={editForm.name}
                />
              </FilterField>
              <FilterField className="min-w-0" label="分组">
                <Input
                  aria-label="节点分组"
                  disabled={pending}
                  onChange={(event) => onEditFormChange({ ...editForm, groups: event.target.value })}
                  placeholder="香港,日本,备用"
                  value={editForm.groups}
                />
              </FilterField>
              <div className="rounded-lg border bg-muted/25 px-3 py-2">
                <CheckboxField
                  checked={editForm.enabled}
                  disabled={pending}
                  label="启用节点"
                  onCheckedChange={(enabled) => onEditFormChange({ ...editForm, enabled })}
                />
              </div>
            </div>
          </FormSection>

          <FormSection description="支持直接粘贴 ss、vmess、trojan、vless 等节点链接。" title="节点链接">
            <FilterField className="min-w-0" label="节点链接">
              <Textarea
                aria-label="节点链接"
                className="min-h-24 font-mono text-xs"
                disabled={pending}
                onChange={(event) => onEditFormChange({ ...editForm, uri: event.target.value })}
                placeholder="ss:// / vmess:// / trojan:// / vless://"
                value={editForm.uri}
              />
            </FilterField>
            <NodeFieldPreview node={node} />
          </FormSection>

          <FormSection description="高级参数用于保存解析后的结构化配置，修改前建议确认 JSON 格式。" title="高级参数">
            <FilterField className="min-w-0" label="高级参数 JSON">
              <Textarea
                aria-label="高级参数 JSON"
                className="min-h-44 font-mono text-xs"
                disabled={pending}
                onChange={(event) => onEditFormChange({ ...editForm, configJson: event.target.value })}
                spellCheck={false}
                value={editForm.configJson}
              />
            </FilterField>
          </FormSection>
        </DialogBody>
        <DialogFooter>
          <Button disabled={pending} onClick={onCancelEdit} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending || !node} onClick={() => (node ? onSaveEdit(node) : undefined)} type="button" variant="info">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <section className="grid gap-3 rounded-lg border bg-card/70 p-3">
      <div className="grid gap-0.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function NodeFieldPreview({ node }: { node: NodeDto | null }) {
  if (!node) {
    return null;
  }

  const fields = [
    ["协议", node.protocol],
    ["服务端", node.server ?? "-"],
    ["端口", node.port?.toString() ?? "-"]
  ];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/35 p-3 max-[640px]:grid-cols-1">
      {fields.map(([label, value]) => (
        <div className="grid gap-1" key={label}>
          <span className="text-xs font-semibold text-muted-foreground">{label}</span>
          <span className="min-w-0 truncate font-mono text-xs">{value}</span>
        </div>
      ))}
    </div>
  );
}

function protocolBadgeClass(protocol: string) {
  const toneIndex = protocol.charCodeAt(0) % protocolToneClasses.length;
  return protocolToneClasses[toneIndex];
}

function nodeConfigSummary(node: NodeDto) {
  const fieldCount = Object.keys(node.config ?? {}).filter((key) => !key.startsWith("__")).length;

  return fieldCount > 0 ? `${fieldCount} 个配置字段` : `${node.protocol} 基础配置`;
}

function nodeTransportLabel(node: NodeDto) {
  const config = node.config ?? {};
  const network = stringConfig(config, "network") ?? stringConfig(config, "net") ?? stringConfig(config, "type");
  const security = securityLabel(config);
  const transport = network && network !== node.protocol ? network : "tcp";

  return security ? `${transport}/${security}` : transport;
}

function securityLabel(config: Record<string, unknown>) {
  if (config.tls === true || config.tls === "tls") {
    return "tls";
  }

  return stringConfig(config, "security") ?? stringConfig(config, "sni") ?? stringConfig(config, "server_name");
}

function stringConfig(config: Record<string, unknown>, key: string) {
  const value = config[key];

  return typeof value === "string" && value.trim() ? value : null;
}

function SourceBadge({ sourceId }: { sourceId: string | null }) {
  if (!sourceId) {
    return (
      <Badge className="border-chart-2/30 bg-chart-2/10 text-chart-2" variant="outline">
        手动
      </Badge>
    );
  }

  return (
    <Badge className="border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
      订阅源
    </Badge>
  );
}

const protocolToneClasses = [
  "border-primary/30 bg-primary/10 text-primary",
  "border-chart-2/30 bg-chart-2/10 text-chart-2",
  "border-chart-3/30 bg-chart-3/10 text-chart-3",
  "border-chart-4/30 bg-chart-4/10 text-chart-4"
];
