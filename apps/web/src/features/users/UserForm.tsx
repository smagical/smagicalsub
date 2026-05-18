import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { CreateUserInput, UserRole } from "@smagicalsub/shared";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { FilterField } from "../../shared/FilterField";

type UserFormProps = {
  form: CreateUserInput;
  pending: boolean;
  setForm: Dispatch<SetStateAction<CreateUserInput>>;
  onSubmit: (form: CreateUserInput) => void;
};

export function UserForm({ form, pending, setForm, onSubmit }: UserFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form className="mb-4 grid grid-cols-[1fr_1.2fr_1fr_140px_auto] items-end gap-3 max-[920px]:grid-cols-1" onSubmit={handleSubmit}>
      <FilterField label="名称">
        <Input onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} />
      </FilterField>
      <FilterField label="邮箱">
        <Input onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required type="email" value={form.email} />
      </FilterField>
      <FilterField label="初始密码">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
          type="password"
          value={form.password}
        />
      </FilterField>
      <FilterField label="角色">
        <NativeSelect onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))} value={form.role}>
          <option value="user">用户</option>
          <option value="admin">管理员</option>
        </NativeSelect>
      </FilterField>
      <Button disabled={pending} type="submit">
        创建用户
      </Button>
    </form>
  );
}
