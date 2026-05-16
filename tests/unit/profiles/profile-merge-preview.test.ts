import { describe, expect, it } from "vitest";
import type { ProfileDto, ProfileRuleDto } from "@smagicalsub/shared";
import { buildMergePreview } from "../../../apps/web/src/features/profiles/profileImport";
import { profile, rule } from "./profile-import-fixtures";

describe("profile merge preview", () => {
  it("merges selected profiles in order and skips duplicates", async () => {
    const profiles: ProfileDto[] = [
      profile("profile-a", "A"),
      profile("profile-b", "B")
    ];
    const rules: Record<string, ProfileRuleDto[]> = {
      "profile-a": [rule("a-1", "profile-a", "DOMAIN-SUFFIX,example.com,Proxy")],
      "profile-b": [
        rule("b-1", "profile-b", "DOMAIN-SUFFIX,example.com,Proxy"),
        rule("b-2", "profile-b", "GEOIP,CN,DIRECT")
      ]
    };

    const preview = await buildMergePreview({
      defaultStrategy: "Proxy",
      description: "",
      name: "合并测试",
      profileIds: ["profile-a", "profile-b"],
      profiles,
      loadRules: async (profileId) => rules[profileId] ?? []
    });

    expect(preview.rules.map((item) => item.rule)).toEqual(["DOMAIN-SUFFIX,example.com,Proxy", "GEOIP,CN,DIRECT"]);
    expect(preview.duplicateRules).toHaveLength(1);
  });

  it("keeps native rule formats when merging profiles", async () => {
    const profiles: ProfileDto[] = [
      profile("profile-a", "A"),
      profile("profile-b", "B")
    ];
    const nativeRule = {
      content: { domain_suffix: ["native.example"], outbound: "direct" },
      enabled: 1,
      format: "sing-box" as const,
      id: "a-native",
      position: 10,
      profile_id: "profile-a",
      rule: JSON.stringify({ domain_suffix: ["native.example"], outbound: "direct" })
    };
    const rules: Record<string, ProfileRuleDto[]> = {
      "profile-a": [nativeRule],
      "profile-b": [{ ...nativeRule, id: "b-native", profile_id: "profile-b" }]
    };

    const preview = await buildMergePreview({
      defaultStrategy: "Proxy",
      description: "",
      name: "合并原生规则",
      profileIds: ["profile-a", "profile-b"],
      profiles,
      loadRules: async (profileId) => rules[profileId] ?? []
    });

    expect(preview.rules).toEqual([
      expect.objectContaining({ content: nativeRule.content, format: "sing-box", rule: nativeRule.rule })
    ]);
    expect(preview.duplicateRules).toHaveLength(1);
  });
});
