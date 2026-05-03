import { useRef, useState } from "react";
import type { TokenSubscriptionFormat } from "./types";
import { loadSubscriptionHealth, type SubscriptionHealthResult } from "./subscriptionHealth";
import {
  copySubscriptionPreview,
  downloadSubscriptionPreview,
  loadSubscriptionPreview
} from "./subscriptionOutput";

type PreviewSource = {
  token: string;
  format: TokenSubscriptionFormat;
} | null;

export function useSubscriptionPreview() {
  const [previewContent, setPreviewContent] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [previewSource, setPreviewSource] = useState<PreviewSource>(null);
  const [healthCheckPending, setHealthCheckPending] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState<SubscriptionHealthResult>(null);
  const healthCheckRequestId = useRef(0);

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

  async function checkSubscriptionHealth(token: string, format: TokenSubscriptionFormat) {
    const requestId = ++healthCheckRequestId.current;
    setHealthCheckPending(true);
    setHealthCheckResult(null);

    try {
      const result = await loadSubscriptionHealth(token, format);
      if (healthCheckRequestId.current === requestId) {
        setHealthCheckResult(result);
      }
      return result;
    } finally {
      if (healthCheckRequestId.current === requestId) {
        setHealthCheckPending(false);
      }
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

  function clearHealthCheckResult() {
    healthCheckRequestId.current += 1;
    setHealthCheckPending(false);
    setHealthCheckResult(null);
  }

  return {
    checkSubscriptionHealth,
    clearPreviewContent,
    clearHealthCheckResult,
    copyPreviewContent,
    downloadPreviewContent,
    healthCheckPending,
    healthCheckResult,
    previewContent,
    previewError,
    previewPending,
    previewSource,
    previewSubscription
  };
}
