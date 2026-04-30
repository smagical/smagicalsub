import type { CreateProfileInput } from "@smagicalsub/shared";
import type { ProfileFormState, ProfileRuleFormState } from "./types";

export function toCreateProfileInput(form: ProfileFormState): CreateProfileInput {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    default_strategy: form.default_strategy.trim() || "Proxy",
    enabled: form.enabled
  };
}

export function toCreateProfileRuleInput(form: ProfileRuleFormState) {
  const position = form.position.trim();

  return {
    rule: form.rule.trim(),
    position: position ? Number(position) : undefined,
    enabled: form.enabled
  };
}
