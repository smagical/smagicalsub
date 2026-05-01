import type { CreateUserInput, ListDto, UpdateUserInput, UserDto } from "@smagicalsub/shared";
import { deleteJson, getJson, patchJson, postJson } from "../../lib/api-client";

export function listUsers() {
  return getJson<ListDto<UserDto>>("/api/users");
}

export function createUser(input: CreateUserInput) {
  return postJson<UserDto>("/api/users", input);
}

export function updateUser(id: string, input: UpdateUserInput) {
  return patchJson<UserDto>(`/api/users/${id}`, input);
}

export function deleteUser(id: string) {
  return deleteJson<{ id: string }>(`/api/users/${id}`);
}
