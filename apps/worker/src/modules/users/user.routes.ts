import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createUserSchema, failure, success, updateUserSchema } from "@smagicalsub/shared";
import { z } from "zod";
import type { AppContext } from "../../env";
import { listResponse } from "../../lib/list-response";
import { requireAdminRole } from "../../middleware/admin-auth";
import { deleteSessionsByUserId } from "../auth/session.repository";
import { countAdmins, createUser, deleteUser, findUserById, listUsers, updateUser } from "../auth/user.repository";

export const userRoutes = new Hono<AppContext>();

const idParamSchema = z.object({
  id: z.string().trim().min(1)
});

userRoutes.use("*", requireAdminRole);

userRoutes.get("/", async (c) => {
  const users = await listUsers(c.env.DB);
  return c.json(success(listResponse(users)));
});

userRoutes.post("/", zValidator("json", createUserSchema), async (c) => {
  const user = await createUser(c.env.DB, c.req.valid("json"));
  return c.json(success(user), 201);
});

userRoutes.patch("/:id", zValidator("param", idParamSchema), zValidator("json", updateUserSchema), async (c) => {
  const id = c.req.valid("param").id;
  const input = c.req.valid("json");
  const current = await findUserById(c.env.DB, id);

  if (!current) {
    return c.json(failure({ code: "USER_NOT_FOUND", message: "用户不存在" }), 404);
  }

  if (current.role === "admin" && input.role === "user" && (await countAdmins(c.env.DB)) <= 1) {
    return c.json(failure({ code: "LAST_ADMIN", message: "不能移除最后一个管理员" }), 409);
  }

  const user = await updateUser(c.env.DB, id, input);
  return c.json(success(user));
});

userRoutes.delete("/:id", zValidator("param", idParamSchema), async (c) => {
  const id = c.req.valid("param").id;
  const current = await findUserById(c.env.DB, id);

  if (!current) {
    return c.json(failure({ code: "USER_NOT_FOUND", message: "用户不存在" }), 404);
  }

  if (current.role === "admin" && (await countAdmins(c.env.DB)) <= 1) {
    return c.json(failure({ code: "LAST_ADMIN", message: "不能删除最后一个管理员" }), 409);
  }

  await deleteSessionsByUserId(c.env.DB, id);
  const user = await deleteUser(c.env.DB, id);
  return c.json(success({ id: user?.id ?? id }));
});
