import { useState } from "react";
import type { TokenSubscriptionFormat } from "./types";
import {
  copySubscriptionPreview,
  downloadSubscriptionPreview,
  loadSubscriptionPreview
} from "./utils";

type PreviewSource = {
  token: string;
  format: TokenSubscriptionFormat;
} | null;

export function useSubscriptionPreview() {
  const [previewContent, setPreviewContent] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [previewSource, setPreviewSource] = useState<PreviewSource>(null);

  async function previewSubscription(token: string, format: TokenSubscriptionFormat) {
    setPreviewPending(true);
    setPreviewError(null);

    try {
      const content = await loadSubscriptionPreview(token, format);
      setPreviewContent(content);
      setPreviewSource({ token, format });
      return true;
    } catch (error) {
      setPreviewContent("");
      setPreviewSource(null);
      setPreviewError(error instanceof Error ? error.message : "订阅预览失败");
      return false;
    } finally {
      setPreviewPending(false);
    }
  }

  async function copyPreviewContent() {
    return copySubscriptionPreview(previewContent);
  }

  function downloadPreviewContent(token: string, format: TokenSubscriptionFormat) {
    if (!previewContent || previewSource?.token !== token || previewSource.format !== format) {
      return false;
    }

    downloadSubscriptionPreview(token, format, previewContent);
    return true;
  }

  function clearPreviewContent() {
    setPreviewContent("");
    setPreviewError(null);
    setPreviewSource(null);
  }

  return {
    clearPreviewContent,
    copyPreviewContent,
    downloadPreviewContent,
    previewContent,
    previewError,
    previewPending,
    previewSource,
    previewSubscription
  };
}
