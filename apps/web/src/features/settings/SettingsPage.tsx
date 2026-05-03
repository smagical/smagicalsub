import { ModulePanel } from "../../shared/ModulePanel";
import { SecuritySettings } from "./SecuritySettings";
import { SiteSettingsForm } from "./SiteSettingsForm";

export function SettingsPage() {
  return (
    <ModulePanel eyebrow="Settings" title="站点设置" description="动态设置控制台名称、副标题、标题图片和登录页文案。">
      <SiteSettingsForm />
      <SecuritySettings />
    </ModulePanel>
  );
}
