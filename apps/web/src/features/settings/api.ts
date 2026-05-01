import type { SiteSettingsDto, UpdateSiteSettingsInput } from "@smagicalsub/shared";
import { getJson, patchJson } from "../../lib/api-client";

export function getSiteSettings() {
  return getJson<SiteSettingsDto>("/api/site-settings");
}

export function updateSiteSettings(input: UpdateSiteSettingsInput) {
  return patchJson<SiteSettingsDto>("/api/site-settings", input);
}
