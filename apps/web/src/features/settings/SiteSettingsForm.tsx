import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { defaultSiteSettings, type SiteSettingsDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { BrandHeader } from "../../shared/BrandHeader";
import { FilterField } from "../../shared/FilterField";
import { PageFeedback } from "../../shared/PageFeedback";
import { getSiteSettings, updateSiteSettings } from "./api";

type SettingsFormState = {
  logLevel: SiteSettingsDto["logLevel"];
  siteName: string;
  siteSubtitle: string;
  titleImageUrl: string;
  loginTitle: string;
  loginDescription: string;
};

export function SiteSettingsForm() {
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

  // 预览使用未保存的表单值，便于确认名称和标题图效果。
  const previewSettings = formToPreview(form);
  const notice = mutation.isSuccess ? "站点品牌设置已保存" : null;

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3 max-[920px]:grid-cols-1">
        <SettingsInput label="站点名称" name="siteName" required value={form.siteName} onChange={setFormValue} />
        <SettingsInput label="副标题" name="siteSubtitle" required value={form.siteSubtitle} onChange={setFormValue} />
        <SettingsInput label="标题图片 URL" name="titleImageUrl" type="url" value={form.titleImageUrl} onChange={setFormValue} />
        <SettingsInput label="登录标题" name="loginTitle" required value={form.loginTitle} onChange={setFormValue} />
      </div>
      <SettingsInput label="登录说明" name="loginDescription" required value={form.loginDescription} onChange={setFormValue} />
      <FilterField className="min-w-0" label="应用日志级别">
        <NativeSelect
          onChange={(event) => setForm((current) => ({ ...current, logLevel: event.target.value as SiteSettingsDto["logLevel"] }))}
          value={form.logLevel}
        >
          <option value="0">0 - 关闭</option>
          <option value="1">1 - 仅错误</option>
          <option value="2">2 - 错误和警告</option>
          <option value="3">3 - 详细调试</option>
        </NativeSelect>
      </FilterField>
      <p className="text-xs leading-5 text-muted-foreground">
        日志只输出到 Cloudflare Workers Logs，不写入 D1；初始化未完成时会自动输出初始化相关日志。
      </p>
      <div className="rounded-xl border bg-background/70 p-4">
        <BrandHeader settings={previewSettings} />
      </div>
      <Button className="w-fit" disabled={mutation.isPending} type="submit" variant="info">
        保存设置
      </Button>
      <PageFeedback error={mutation.error ?? settingsQuery.error} notice={notice} />
    </form>
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
