import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ProfileFormState } from "./types";
import { toCreateProfileInput } from "./utils";

type ProfileFormProps = {
  form: ProfileFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<ProfileFormState>>;
  onSubmit: (value: ReturnType<typeof toCreateProfileInput>) => void;
};

export function ProfileForm({ form, pending, setForm, onSubmit }: ProfileFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateProfileInput(form));
  }

  return (
    <form className="form-grid profile-form" onSubmit={handleSubmit}>
      <label>
        <span>名称</span>
        <input
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="默认配置"
          required
          type="text"
          value={form.name}
        />
      </label>
      <label>
        <span>默认策略</span>
        <input
          onChange={(event) => setForm((current) => ({ ...current, default_strategy: event.target.value }))}
          placeholder="Proxy"
          required
          type="text"
          value={form.default_strategy}
        />
      </label>
      <label className="wide-field">
        <span>描述</span>
        <input
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="用于主力设备或备用线路"
          type="text"
          value={form.description}
        />
      </label>
      <label className="checkbox-field">
        <input
          checked={form.enabled}
          onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
          type="checkbox"
        />
        <span>启用</span>
      </label>
      <button className="primary-button" disabled={pending} type="submit">
        创建配置档
      </button>
    </form>
  );
}
