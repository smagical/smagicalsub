import { defaultSiteSettings, siteSettingsSchema, type SiteSettingsDto, type UpdateSiteSettingsInput } from "@smagicalsub/shared";

const siteSettingsKey = "settings:site";

export async function getSiteSettings(kv: KVNamespace): Promise<SiteSettingsDto> {
  const raw = await kv.get(siteSettingsKey);

  if (!raw) {
    return defaultSiteSettings;
  }

  return parseStoredSettings(raw);
}

export async function updateSiteSettings(kv: KVNamespace, input: UpdateSiteSettingsInput) {
  const nextSettings = { ...(await getSiteSettings(kv)), ...input };
  const parsed = siteSettingsSchema.parse(nextSettings);

  await kv.put(siteSettingsKey, JSON.stringify(parsed));
  return parsed;
}

function parseStoredSettings(raw: string): SiteSettingsDto {
  try {
    const parsed = siteSettingsSchema.safeParse({ ...defaultSiteSettings, ...JSON.parse(raw) });
    return parsed.success ? parsed.data : defaultSiteSettings;
  } catch {
    return defaultSiteSettings;
  }
}
