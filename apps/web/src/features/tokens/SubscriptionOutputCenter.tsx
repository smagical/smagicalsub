import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import type { SubscribeTokenDto } from "@smagicalsub/shared";
import { Activity, Copy, Download, ExternalLink, FileText } from "lucide-react";
import { StatusBadge } from "../../shared/StatusBadge";
import { SubscriptionHealthStatus } from "./SubscriptionHealthStatus";
import { SubscriptionPreviewBlock } from "./SubscriptionPreviewBlock";
import { TokenOutputDiagnosticsPanel } from "./TokenOutputDiagnosticsPanel";
import type { SubscriptionHealthResult } from "./subscriptionHealth";
import type { TokenSubscriptionFormat } from "./types";
import { tokenFormatHints, tokenSubscriptionFormats } from "./types";
import type { TokenOutputDiagnostics } from "./useTokenOutputDiagnostics";
import { subscriptionFormatLinks, subscriptionFormatPath } from "./subscriptionOutput";

type SubscriptionOutputCenterProps = {
  copyFormat: TokenSubscriptionFormat;
  previewContent: string;
  previewPending: boolean;
  previewError: string | null;
  previewSource: { token: string; format: TokenSubscriptionFormat } | null;
  healthCheckPending: boolean;
  healthCheckResult: SubscriptionHealthResult;
  token: SubscribeTokenDto;
  diagnostics: TokenOutputDiagnostics;
  tokens: SubscribeTokenDto[];
  onClearPreview: () => void;
  onCopy: (token: SubscribeTokenDto) => void;
  onCopyAllFormats: (token: SubscribeTokenDto) => void;
  onCopyPreview: () => void;
  onDownloadPreview: (token: SubscribeTokenDto) => void;
  onFormatChange: (format: TokenSubscriptionFormat) => void;
  onHealthCheck: (token: SubscribeTokenDto) => void;
  onOpen: (token: SubscribeTokenDto) => void;
  onPreview: (token: SubscribeTokenDto) => void;
  onTokenChange: (id: string) => void;
};

export function SubscriptionOutputCenter(props: SubscriptionOutputCenterProps) {
  const previewReady =
    !!props.previewContent &&
    props.previewSource?.token === (props.token.custom_path || props.token.token) &&
    props.previewSource.format === props.copyFormat;

  return (
    <section aria-label="订阅输出中心" className="rounded-lg border bg-card/80 p-4 shadow-sm ring-1 ring-primary/15">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">订阅输出中心</span>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect aria-label="输出令牌" className="max-w-xs" onChange={(event) => props.onTokenChange(event.target.value)} value={props.token.id}>
              {props.tokens.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.name}
                </option>
              ))}
            </NativeSelect>
            <StatusBadge enabled={props.token.enabled} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect aria-label="输出格式" className="max-w-xs" onChange={(event) => props.onFormatChange(event.target.value as TokenSubscriptionFormat)} value={props.copyFormat}>
              {tokenSubscriptionFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </NativeSelect>
            {formatBadges(props.token)}
          </div>
          <div className="flex flex-wrap items-center gap-2">{metaBadges(props.token)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actionButtons(props, previewReady)}</div>
      </div>
      <Separator className="my-4" />
      <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <div className="rounded-md border bg-muted/40 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">当前订阅路径</p>
              <SubscriptionHealthStatus pending={props.healthCheckPending} result={props.healthCheckResult} />
            </div>
            <p className="break-all font-mono text-xs text-foreground">{subscriptionFormatPath(props.token.token, props.copyFormat, props.token.custom_path)}</p>
          </div>
          <p className="text-sm text-muted-foreground">{tokenFormatHints[props.copyFormat]}</p>
        </div>
      </div>
      {props.previewError ? <p className="mt-3 text-sm text-destructive">{props.previewError}</p> : null}
      <TokenOutputDiagnosticsPanel diagnostics={props.diagnostics} />
      {previewReady ? (
        <SubscriptionPreviewBlock
          content={props.previewContent}
          format={props.copyFormat}
          onClear={props.onClearPreview}
          onCopy={props.onCopyPreview}
        />
      ) : null}
    </section>
  );
}

function formatBadges(token: SubscribeTokenDto) {
  return subscriptionFormatLinks(token.token, token.custom_path).map((link) => (
    <Badge key={link.value} variant="secondary">
      {link.label} .{link.extension}
    </Badge>
  ));
}

function metaBadges(token: SubscribeTokenDto) {
  return (
    <>
      <Badge variant="outline">配置档：{token.profile_name ?? "未绑定"}</Badge>
      <Badge variant="outline">过期：{token.expires_at ?? "永不过期"}</Badge>
      <Badge variant="outline">最近使用：{token.last_used_at ?? "未使用"}</Badge>
    </>
  );
}

function actionButtons(props: SubscriptionOutputCenterProps, previewReady: boolean) {
  return (
    <>
      <Button onClick={() => props.onCopy(props.token)} size="sm" type="button" variant="outline">
        <Copy data-icon="inline-start" />
        复制当前格式
      </Button>
      <Button onClick={() => props.onCopyAllFormats(props.token)} size="sm" type="button" variant="secondary">
        <Copy data-icon="inline-start" />
        复制全部格式
      </Button>
      <Button disabled={props.previewPending} onClick={() => props.onPreview(props.token)} size="sm" type="button" variant="outline">
        <FileText data-icon="inline-start" />
        {props.previewPending ? "加载中" : "加载预览"}
      </Button>
      <Button disabled={props.healthCheckPending} onClick={() => props.onHealthCheck(props.token)} size="sm" type="button" variant="outline">
        <Activity data-icon="inline-start" />
        {props.healthCheckPending ? "检查中" : "健康检查"}
      </Button>
      <Button disabled={!previewReady} onClick={() => props.onDownloadPreview(props.token)} size="sm" type="button" variant="outline">
        <Download data-icon="inline-start" />
        下载预览
      </Button>
      <Button onClick={() => props.onOpen(props.token)} size="sm" type="button" variant="ghost">
        <ExternalLink data-icon="inline-start" />
        打开预览
      </Button>
    </>
  );
}
