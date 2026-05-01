import { describe, expect, it } from "vitest";
import { adminTokenFromRequest, isAdminTokenAuthorized } from "./admin-auth";

describe("admin auth helpers", () => {
  it("uses X-Admin-Token before Authorization", () => {
    expect(adminTokenFromRequest("Bearer wrong", "  secret  ")).toBe("secret");
  });

  it("reads a bearer token case-insensitively", () => {
    expect(adminTokenFromRequest("bearer secret", undefined)).toBe("secret");
    expect(adminTokenFromRequest("Bearer secret", undefined)).toBe("secret");
  });

  it("ignores unsupported authorization schemes", () => {
    expect(adminTokenFromRequest("Basic secret", undefined)).toBeUndefined();
  });

  it("allows requests when no admin token is configured", () => {
    expect(isAdminTokenAuthorized("  ", undefined, undefined)).toBe(true);
  });

  it("authorizes only matching tokens when configured", () => {
    expect(isAdminTokenAuthorized("secret", "Bearer secret", undefined)).toBe(true);
    expect(isAdminTokenAuthorized("secret", "Bearer wrong", undefined)).toBe(false);
    expect(isAdminTokenAuthorized("secret", undefined, undefined)).toBe(false);
  });
});
