import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TokenSubscriptionFormat } from "./types";
import { subscriptionPreviewExtension, subscriptionPreviewStats } from "./subscriptionOutput";

type SubscriptionPreviewBlockProps = {
  content: string;
  format: TokenSubscriptionFormat;
  onClear: () => void;
  onCopy: () => void;
};

export function SubscriptionPreviewBlock({ content, format, onClear, onCopy }: SubscriptionPreviewBlockProps) {
  const previewClassName = cn(
    "max-h-56 min-w-0 max-w-full overflow-auto whitespace-pre-wrap border-t p-3 font-mono text-xs leading-5",
    format === "base64" ? "break-all" : "break-words [overflow-wrap:anywhere]"
  );

  return (
    <div className="mt-3 min-w-0 rounded-md bg-muted/50">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground">{subscriptionPreviewStats(content)}</span>
        <span className="text-xs text-muted-foreground">.{subscriptionPreviewExtension(format)}</span>
        <div className="flex items-center gap-2">
          <Button onClick={onCopy} size="xs" type="button" variant="outline">
            复制内容
          </Button>
          <Button onClick={onClear} size="xs" type="button" variant="ghost">
            清空
          </Button>
        </div>
      </div>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">预览内容已截断为前 5000 字符，适合快速确认格式与节点分组。</div>
      <pre className={previewClassName}>{content}</pre>
    </div>
  );
}
