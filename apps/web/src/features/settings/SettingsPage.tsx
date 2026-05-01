import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultSiteSettings, type SiteSettingsDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { BrandHeader } from "../../shared/BrandHeader";
import { FilterField } from "../../shared/FilterField";
import { ModulePanel } from "../../shared/ModulePanel";
import { PageFeedback } from "../../shared/PageFeedback";
import { getSiteSettings, updateSiteSettings } from "./api";

type SettingsFormState = {
  siteName: string;
  siteSubtitle: string;
  titleImageUrl: string;
  loginTitle: string;
  loginDescription: string;
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: getSiteSettings, retry: false });
  const [form, setForm] = useState(() => settingsToForm(defaultSiteSettings));
  const mutation = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: async (settings) => {
      queryClient.setQueryData(["site-settings"], settings);
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    }
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(settingsToForm(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(formToPayload(form));
  }

  const previewSettings = formToPreview(form);
  const notice = mutation.isSuccess ? "站点品牌设置已保存" : null;

  return (
    <ModulePanel eyebrow="Settings" title="站点设置" description="动态设置控制台名称、副标题、标题图片和登录页文案。">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 max-[920px]:grid-cols-1">
          <SettingsInput label="站点名称" name="siteName" required value={form.siteName} onChange={setFormValue} />
          <SettingsInput label="副标题" name="siteSubtitle" required value={form.siteSubtitle} onChange={setFormValue} />
          <SettingsInput label="标题图片 URL" name="titleImageUrl" type="url" value={form.titleImageUrl} onChange={setFormValue} />
          <SettingsInput label="登录标题" name="loginTitle" required value={form.loginTitle} onChange={setFormValue} />
        </div>
        <SettingsInput label="登录说明" name="loginDescription" required value={form.loginDescription} onChange={setFormValue} />
        <div className="rounded-xl border bg-background/70 p-4">
          <BrandHeader settings={previewSettings} />
        </div>
        <Button className="w-fit" disabled={mutation.isPending} type="submit">
          保存设置
        </Button>
      </form>
      <PageFeedback error={mutation.error ?? settingsQuery.error} notice={notice} />
    </ModulePanel>
  );

  function setFormValue(name: keyof SettingsFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }
}

function SettingsInput({
  label,
  name,
  onChange,
  required,
  type = "text",
  value
}: {
  label: string;
  name: keyof SettingsFormState;
  onChange: (name: keyof SettingsFormState, value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <FilterField className="min-w-0" label={label}>
      <Input onChange={(event) => onChange(name, event.target.value)} required={required} type={type} value={value} />
    </FilterField>
  );
}

function settingsToForm(settings: SiteSettingsDto): SettingsFormState {
  return { ...settings, titleImageUrl: settings.titleImageUrl ?? "" };
}

function formToPayload(form: SettingsFormState) {
  return { ...form, titleImageUrl: form.titleImageUrl.trim() || null };
}

function formToPreview(form: SettingsFormState): SiteSettingsDto {
  return { ...formToPayload(form), siteName: form.siteName || "S", siteSubtitle: form.siteSubtitle || "多格式订阅管理" };
}
