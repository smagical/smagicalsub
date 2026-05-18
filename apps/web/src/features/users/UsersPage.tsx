import type { CreateUserInput, UserDto, UserRole } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ModulePanel } from "../../shared/ModulePanel";
import { PageFeedback } from "../../shared/PageFeedback";
import { getCurrentUser } from "../auth/api";
import { createUser, deleteUser, listUsers, updateUser } from "./api";
import { UserForm } from "./UserForm";
import { UsersTable } from "./UsersTable";

const emptyForm: CreateUserInput = { email: "", name: "", password: "", role: "user" };

export function UsersPage() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: listUsers, retry: false });
  const meQuery = useQuery({ queryKey: ["auth-me"], queryFn: getCurrentUser, retry: false });
  const [form, setForm] = useState<CreateUserInput>(emptyForm);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const createMutation = useMutation({ mutationFn: createUser, onSuccess: onUsersChanged });
  const updateMutation = useMutation({ mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUser>[1] }) => updateUser(id, input), onSuccess: onUsersChanged });
  const deleteMutation = useMutation({ mutationFn: deleteUser, onSuccess: onUsersChanged });
  const users = usersQuery.data?.items ?? [];
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const notice = createMutation.isSuccess || updateMutation.isSuccess || deleteMutation.isSuccess ? "用户设置已更新" : null;
  const error = usersQuery.error ?? meQuery.error ?? createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  return (
    <ModulePanel eyebrow="Users" title="用户管理" description="创建后台用户、调整角色，并为用户重置登录密码。" tone="rose">
      <UserForm form={form} pending={pending} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />
      <PageFeedback error={error} notice={notice} />
      {users.length === 0 ? (
        <EmptyState label="还没有用户" />
      ) : (
        <UsersTable
          currentUserId={meQuery.data?.id}
          passwordDrafts={passwordDrafts}
          pending={pending}
          users={users}
          onDelete={(user) => deleteMutation.mutate(user.id)}
          onPasswordChange={(id, password) => setPasswordDrafts((current) => ({ ...current, [id]: password }))}
          onRoleChange={changeRole}
          onSavePassword={savePassword}
        />
      )}
    </ModulePanel>
  );

  async function onUsersChanged() {
    setForm(emptyForm);
    setPasswordDrafts({});
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["users"] }), queryClient.invalidateQueries({ queryKey: ["auth-me"] })]);
  }

  function changeRole(user: UserDto, role: UserRole) {
    updateMutation.mutate({ id: user.id, input: { role } });
  }

  function savePassword(user: UserDto) {
    const password = passwordDrafts[user.id]?.trim();

    if (password) {
      updateMutation.mutate({ id: user.id, input: { password } });
    }
  }
}
