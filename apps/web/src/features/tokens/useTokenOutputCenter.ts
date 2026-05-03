import { useState } from "react";
import type { SubscribeTokenDto } from "@smagicalsub/shared";
import type { TokenSubscriptionFormat } from "./types";
import { useSubscriptionPreview } from "./useSubscriptionPreview";

export function useTokenOutputCenter(onNotice: (notice: string) => void) {
  const [copyFormat, setCopyFormat] = useState<TokenSubscriptionFormat>("clash");
  const [outputTokenId, setOutputTokenId] = useState("");
  const preview = useSubscriptionPreview();

  function resetOutputState() {
    preview.clearPreviewContent();
    preview.clearHealthCheckResult();
  }

  function changeCopyFormat(format: TokenSubscriptionFormat) {
    setCopyFormat(format);
    resetOutputState();
  }

  function changeOutputToken(id: string) {
    setOutputTokenId(id);
    resetOutputState();
  }

  async function previewSubscription(token: SubscribeTokenDto) {
    if (await preview.previewSubscription(token.token, copyFormat)) {
      onNotice("订阅预览已加载");
    }
  }

  async function checkSubscriptionHealth(token: SubscribeTokenDto) {
    const result = await preview.checkSubscriptionHealth(token.token, copyFormat);
    onNotice(result?.ok ? "订阅健康检查通过" : "订阅健康检查发现异常");
  }

  async function copyPreviewContent() {
    if (await preview.copyPreviewContent()) {
      onNotice("预览内容已复制");
    }
  }

  function downloadPreviewContent(token: SubscribeTokenDto) {
    if (preview.downloadPreviewContent(token.token, copyFormat)) {
      onNotice("预览内容已下载");
    }
  }

  return {
    ...preview,
    checkSubscriptionHealth,
    copyFormat,
    copyPreviewContent,
    downloadPreviewContent,
    outputTokenId,
    previewSubscription,
    setCopyFormat: changeCopyFormat,
    setOutputTokenId: changeOutputToken
  };
}
