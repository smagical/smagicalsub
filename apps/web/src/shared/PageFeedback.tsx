import { useEffect, useRef } from "react";
import { toast } from "sonner";

type PageFeedbackProps = {
  error?: unknown;
  notice?: string | null;
};

export function PageFeedback({ error, notice }: PageFeedbackProps) {
  const lastError = useRef<string | null>(null);
  const lastNotice = useRef<string | null>(null);
  const errorMessage = error instanceof Error ? error.message : null;

  useEffect(() => {
    if (notice && notice !== lastNotice.current) {
      toast.success(notice);
    }

    lastNotice.current = notice ?? null;
  }, [notice]);

  useEffect(() => {
    if (errorMessage && errorMessage !== lastError.current) {
      toast.error(errorMessage);
    }

    lastError.current = errorMessage;
  }, [errorMessage]);

  return null;
}
