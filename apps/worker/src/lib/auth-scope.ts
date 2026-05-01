import type { AuthUserDto } from "@smagicalsub/shared";

export type OwnerScope = {
  isAdmin: boolean;
  ownerId: string | null;
};

export function ownerScope(user: AuthUserDto): OwnerScope {
  return {
    isAdmin: user.role === "admin",
    ownerId: user.id === "admin-token" ? null : user.id
  };
}

export function ownerWhere(scope: OwnerScope, column = "owner_id") {
  return scope.isAdmin ? { params: [] as string[], sql: "" } : { params: [scope.ownerId ?? ""], sql: ` AND ${column} = ?` };
}
