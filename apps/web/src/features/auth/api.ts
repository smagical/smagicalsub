import type {
  AuthStatusDto,
  AuthUserDto,
  BootstrapAdminInput,
  ChangePasswordInput,
  ListDto,
  LoginDto,
  LoginInput,
  RecoverAdminPasswordInput,
  SessionDto
} from "@smagicalsub/shared";
import { deleteJson, getJson, postJson } from "../../lib/api-client";

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

export function recoverAdminPassword(input: RecoverAdminPasswordInput) {
  return postJson<{ ok: boolean }>("/api/auth/recover-admin-password", input);
}

export function listSessions() {
  return getJson<ListDto<SessionDto>>("/api/auth/sessions");
}

export function deleteSession(id: string) {
  return deleteJson<{ id: string }>(`/api/auth/sessions/${id}`);
}
