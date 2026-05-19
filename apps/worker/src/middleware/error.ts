import type { ErrorHandler, NotFoundHandler } from "hono";
import { failure } from "@smagicalsub/shared";
import { errorDetail, logEvent, requestId } from "../lib/request-log";

export const onError: ErrorHandler = (error, c) => {
  const id = requestId(c);
  logEvent(c, "error", "worker.unhandled_error", {
    ...errorDetail(error),
    requestId: id
  });

  return c.json(
    failure({
      code: "INTERNAL_SERVER_ERROR",
      message: `服务暂时不可用，请在 Cloudflare 日志中搜索 requestId=${id}`
    }),
    500
  );
};

export const notFound: NotFoundHandler = (c) => {
  return c.json(
    failure({
      code: "NOT_FOUND",
      message: "接口不存在"
    }),
    404
  );
};
