import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import type { SubscribeTokenDto } from "@smagicalsub/shared";
import { Activity, Copy, Download, ExternalLink, FileText, Link2, Route, ShieldCheck } from "lucide-react";
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
    <section aria-label="订阅输出中心" className="rounded-xl border bg-card p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(220px,auto)]">
        <div className="grid gap-2">
          <Badge className="w-fit gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2" variant="outline">
            <Route />
            订阅输出中心
          </Badge>
          <p className="text-sm text-muted-foreground">
            当前选择的令牌会决定输出的路径、格式和节点范围。自定义路径会直接映射到 `/sub/你的路径`。
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <NativeSelect aria-label="输出令牌" onChange={(event) => props.onTokenChange(event.target.value)} value={props.token.id}>
              {props.tokens.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect aria-label="输出格式" onChange={(event) => props.onFormatChange(event.target.value as TokenSubscriptionFormat)} value={props.copyFormat}>
              {tokenSubscriptionFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge enabled={props.token.enabled} />
            {formatBadges(props.token)}
          </div>
          <div className="flex flex-wrap items-center gap-2">{metaBadges(props.token)}</div>
        </div>
        <div className="grid content-start gap-2 rounded-xl border bg-muted/35 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ShieldCheck />
              快速操作
            </span>
            <SubscriptionHealthStatus pending={props.healthCheckPending} result={props.healthCheckResult} />
          </div>
          <div className="flex flex-wrap items-center gap-2">{actionButtons(props, previewReady)}</div>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.68fr)]">
        <div className="grid gap-2">
          <div className="rounded-xl border bg-muted/30 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Link2 />
                当前订阅路径
              </p>
            </div>
            <p className="break-all font-mono text-sm text-foreground">{subscriptionFormatPath(props.token.token, props.copyFormat, props.token.custom_path)}</p>
          </div>
          <p className="text-sm text-muted-foreground">{tokenFormatHints[props.copyFormat]}</p>
        </div>
        <div className="grid gap-2 rounded-xl border bg-background/90 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">快速提示</p>
          <p className="text-sm text-muted-foreground">路径为空时使用系统生成地址，填写后会覆盖默认订阅路径。</p>
          <p className="text-sm text-muted-foreground">节点为空时输出全部启用节点，选择部分节点后只输出所选内容。</p>
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
