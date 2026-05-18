import type { ErrorHandler, NotFoundHandler } from "hono";
import { failure } from "@smagicalsub/shared";

export const onError: ErrorHandler = (error, c) => {
  console.error(error);

  return c.json(
    failure({
      code: "INTERNAL_SERVER_ERROR",
      message: "服务暂时不可用"
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
