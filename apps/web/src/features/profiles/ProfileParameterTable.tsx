import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ProfileModuleFormat, ProfileModuleType } from "@smagicalsub/shared";
import { Copy, FileJson2 } from "lucide-react";
import { ProfileParameterValueEditor } from "./ProfileParameterValueEditor";
import { buildConfigParameterRows, formatLabel, moduleTypeLabel, resolveParameterContent } from "./profileParameterUtils";

type ConfigParameterTableProps = {
  compact?: boolean;
  content: string | Record<string, unknown>;
  format: ProfileModuleFormat;
  onChange?: (content: string) => void;
  maxRows?: number;
  type: ProfileModuleType;
};

export function ConfigParameterTable({ compact = false, content, format, maxRows = 80, onChange, type }: ConfigParameterTableProps) {
  const parsed = useMemo(() => resolveParameterContent(content), [content]);
  const rows = useMemo(() => parsed ? buildConfigParameterRows(parsed, format, type) : [], [format, parsed, type]);
  const visibleRows = rows.slice(0, maxRows);
  const editable = Boolean(onChange);
  const contentKey = useMemo(() => typeof content === "string" ? content : JSON.stringify(content), [content]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts({});
  }, [contentKey]);

  return (
    <div className={cn("grid gap-2 rounded-xl border bg-card/70 p-3", compact && "gap-1.5 p-2.5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge className="gap-1.5 border-chart-4/30 bg-chart-4/10 text-chart-4" variant="outline">
            <FileJson2 />
            参数表格
          </Badge>
          <span className="text-xs text-muted-foreground">
            适用于 {formatLabel(format)} / {moduleTypeLabel(type)}，{editable ? "修改表格会自动同步 JSON。" : "JSON 仍是最高级编辑入口。"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {editable ? <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">可编辑</Badge> : null}
          <Badge variant="secondary">{rows.length} 项</Badge>
        </div>
      </div>

      {!parsed ? (
        <div className="rounded-lg border border-dashed bg-background/70 px-3 py-2 text-xs text-destructive">
          JSON 暂时无法解析，修正 JSON 后会显示参数表格。
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          当前配置为空，可以直接在 JSON 里添加高级参数。
        </div>
      ) : (
        <div className={cn("overflow-auto rounded-lg border bg-background/70", compact ? "max-h-56" : "max-h-72")}>
          <Table className={cn("table-fixed", editable ? "min-w-[960px]" : "min-w-[780px]")}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">参数路径</TableHead>
                <TableHead className="w-[96px]">类型</TableHead>
                <TableHead className="w-[22%]">当前值</TableHead>
                <TableHead>说明</TableHead>
                <TableHead className="w-[84px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.path}>
                  <TableCell className="whitespace-normal font-mono text-xs">
                    <span className="break-all">{row.path}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="font-mono" variant="outline">{row.type}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-normal text-xs align-top">
                    {editable && onChange ? (
                      <ProfileParameterValueEditor
                        content={contentKey}
                        draft={drafts[row.path]}
                        row={row}
                        onChange={(nextContent) => onChange(nextContent)}
                        onDraftChange={(nextDraft) => {
                          setDrafts((current) => {
                            const next = { ...current };
                            if (nextDraft === undefined) {
                              delete next[row.path];
                            } else {
                              next[row.path] = nextDraft;
                            }
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <span className="break-all font-mono">{row.value}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal text-xs leading-5 text-muted-foreground">
                    {row.description}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={() => copyText(row.rawValue)} size="xs" type="button" variant="outline">
                          <Copy data-icon="inline-start" />
                          复制
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>复制当前参数值</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {rows.length > visibleRows.length ? (
        <div className="text-xs text-muted-foreground">
          还有 {rows.length - visibleRows.length} 项未展示，可在 JSON 内容中继续查看和编辑。
        </div>
      ) : null}
    </div>
  );
}

function copyText(value: string) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }

  void navigator.clipboard.writeText(value);
}
