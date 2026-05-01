import type { AuthStatusDto, AuthUserDto, BootstrapAdminInput, ChangePasswordInput, LoginDto, LoginInput } from "@smagicalsub/shared";
import { getJson, postJson } from "../../lib/api-client";

export function getAuthStatus() {
  return getJson<AuthStatusDto>("/api/auth/status");
}

export function login(input: LoginInput) {
  return postJson<LoginDto>("/api/auth/login", input);
}

export function bootstrapAdmin(input: BootstrapAdminInput) {
  return postJson<LoginDto>("/api/auth/bootstrap", input);
}

export function getCurrentUser() {
  return getJson<AuthUserDto>("/api/auth/me");
}

export function logout() {
  return postJson<{ ok: boolean }>("/api/auth/logout");
}

export function changePassword(input: ChangePasswordInput) {
  return postJson<{ ok: boolean }>("/api/auth/password", input);
}
