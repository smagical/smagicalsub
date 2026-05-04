import { useEffect, useRef } from "react";
import { toast } from "sonner";

type FeedbackNotice = string | { id: string | number; message: string } | null | undefined;

type PageFeedbackProps = {
  error?: unknown;
  notice?: FeedbackNotice;
};

export function PageFeedback({ error, notice }: PageFeedbackProps) {
  const lastError = useRef<string | null>(null);
  const lastNotice = useRef<string | number | null>(null);
  const errorMessage = error instanceof Error ? error.message : null;
  const noticeMessage = typeof notice === "string" ? notice : notice?.message ?? null;
  const noticeKey = typeof notice === "string" ? notice : notice?.id ?? noticeMessage;

  useEffect(() => {
    if (noticeMessage && noticeKey !== lastNotice.current) {
      toast.success(noticeMessage);
    }

    lastNotice.current = noticeKey ?? null;
  }, [noticeKey, noticeMessage]);

  useEffect(() => {
    if (errorMessage && errorMessage !== lastError.current) {
      toast.error(errorMessage);
    }

    lastError.current = errorMessage;
  }, [errorMessage]);

  return null;
}
