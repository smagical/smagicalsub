import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { changePassword, deleteSession, listSessions } from "../auth/api";
import { FilterField } from "../../shared/FilterField";
import { PageFeedback } from "../../shared/PageFeedback";
import { SessionsTable } from "./SessionsTable";

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
};

export function SecuritySettings() {
  const queryClient = useQueryClient();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const sessionsQuery = useQuery({ queryKey: ["auth-sessions"], queryFn: listSessions, retry: false });
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: async () => {
      setPasswordForm({ currentPassword: "", newPassword: "" });
      await queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    }
  });
  const revokeMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
    }
  });

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    passwordMutation.mutate(passwordForm);
  }

  const sessions = sessionsQuery.data?.items ?? [];
  const notice = revokeMutation.isSuccess
    ? "登录会话已撤销"
    : passwordMutation.isSuccess
      ? "登录密码已更新，其他会话需要重新登录"
      : null;

  return (
    <section className="grid gap-4 rounded-md border bg-background/70 p-4">
      <form className="grid gap-4" onSubmit={handlePasswordSubmit}>
        <div>
          <h3 className="text-base font-semibold">账号安全</h3>
          <p className="mt-1 text-sm text-muted-foreground">修改密码会清理该账号的其他会话，也可以单独撤销某个登录会话。</p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[920px]:grid-cols-1">
          <PasswordInput label="当前密码" name="currentPassword" value={passwordForm.currentPassword} onChange={setPasswordValue} />
          <PasswordInput label="新密码" name="newPassword" value={passwordForm.newPassword} onChange={setPasswordValue} />
        </div>
        <Button className="w-fit" disabled={passwordMutation.isPending} type="submit">
          更新密码
        </Button>
      </form>
      <div className="grid gap-3">
        <div>
          <h3 className="text-base font-semibold">登录会话</h3>
          <p className="mt-1 text-sm text-muted-foreground">查看当前账号的有效登录记录，并主动撤销不再使用的会话。</p>
        </div>
        <SessionsTable
          pending={sessionsQuery.isLoading || revokeMutation.isPending}
          sessions={sessions}
          onRevoke={(id) => revokeMutation.mutate(id)}
        />
      </div>
      <PageFeedback error={passwordMutation.error ?? revokeMutation.error ?? sessionsQuery.error} notice={notice} />
    </section>
  );

  function setPasswordValue(name: keyof PasswordFormState, value: string) {
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }
}

function PasswordInput({
  label,
  name,
  onChange,
  value
}: {
  label: string;
  name: keyof PasswordFormState;
  onChange: (name: keyof PasswordFormState, value: string) => void;
  value: string;
}) {
  return (
    <FilterField className="min-w-0" label={label}>
      <Input autoComplete="current-password" minLength={8} onChange={(event) => onChange(name, event.target.value)} required type="password" value={value} />
    </FilterField>
  );
}
