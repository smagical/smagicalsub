import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { SubscribeTokenDto } from "@smagicalsub/shared";
import { Copy, Download, ExternalLink, FileText } from "lucide-react";
import { StatusBadge } from "../../shared/StatusBadge";
import { TokenOutputDiagnosticsPanel } from "./TokenOutputDiagnosticsPanel";
import type { TokenSubscriptionFormat } from "./types";
import { tokenFormatHints, tokenSubscriptionFormats } from "./types";
import type { TokenOutputDiagnostics } from "./useTokenOutputDiagnostics";
import { subscriptionFormatLinks, subscriptionFormatPath, subscriptionPreviewExtension, subscriptionPreviewStats } from "./utils";

type SubscriptionOutputCenterProps = {
  copyFormat: TokenSubscriptionFormat;
  previewContent: string;
  previewPending: boolean;
  previewError: string | null;
  previewSource: { token: string; format: TokenSubscriptionFormat } | null;
  token: SubscribeTokenDto;
  diagnostics: TokenOutputDiagnostics;
  tokens: SubscribeTokenDto[];
  onClearPreview: () => void;
  onCopy: (token: SubscribeTokenDto) => void;
  onCopyAllFormats: (token: SubscribeTokenDto) => void;
  onCopyPreview: () => void;
  onDownloadPreview: (token: SubscribeTokenDto) => void;
  onFormatChange: (format: TokenSubscriptionFormat) => void;
  onOpen: (token: SubscribeTokenDto) => void;
  onPreview: (token: SubscribeTokenDto) => void;
  onTokenChange: (id: string) => void;
};

export function SubscriptionOutputCenter(props: SubscriptionOutputCenterProps) {
  const previewReady =
    !!props.previewContent &&
    props.previewSource?.token === props.token.token &&
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
            {formatBadges(props.token.token)}
          </div>
          <div className="flex flex-wrap items-center gap-2">{metaBadges(props.token)}</div>
          <p className="font-mono text-xs text-foreground">{subscriptionFormatPath(props.token.token, props.copyFormat)}</p>
          <p className="text-sm text-muted-foreground">{tokenFormatHints[props.copyFormat]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{actionButtons(props, previewReady)}</div>
      </div>
      {props.previewError ? <p className="mt-3 text-sm text-destructive">{props.previewError}</p> : null}
      <TokenOutputDiagnosticsPanel diagnostics={props.diagnostics} />
      {previewReady ? previewBlock(props) : null}
    </section>
  );
}

function formatBadges(token: string) {
  return subscriptionFormatLinks(token).map((link) => (
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
      <Button onClick={() => props.onCopyAllFormats(props.token)} size="sm" type="button" variant="outline">
        <Copy data-icon="inline-start" />
        复制全部格式
      </Button>
      <Button disabled={props.previewPending} onClick={() => props.onPreview(props.token)} size="sm" type="button" variant="outline">
        <FileText data-icon="inline-start" />
        {props.previewPending ? "加载中" : "加载预览"}
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

function previewBlock(props: SubscriptionOutputCenterProps) {
  return (
    <div className="mt-3 rounded-md bg-muted/50">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground">{subscriptionPreviewStats(props.previewContent)}</span>
        <span className="text-xs text-muted-foreground">.{subscriptionPreviewExtension(props.copyFormat)}</span>
        <div className="flex items-center gap-2">
          <Button onClick={props.onCopyPreview} size="xs" type="button" variant="outline">
            复制内容
          </Button>
          <Button onClick={props.onClearPreview} size="xs" type="button" variant="ghost">
            清空
          </Button>
        </div>
      </div>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">预览内容已截断为前 5000 字符，适合快速确认格式与节点分组。</div>
      <pre className="max-h-56 overflow-auto border-t p-3 font-mono text-xs">{props.previewContent}</pre>
    </div>
  );
}
