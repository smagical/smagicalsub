import type { SiteSettingsDto } from "@smagicalsub/shared";
import { cn } from "@/lib/utils";

type BrandHeaderProps = {
  settings: SiteSettingsDto;
  className?: string;
};

export function BrandHeader({ className, settings }: BrandHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandImage settings={settings} />
      <div>
        <strong className="block">{settings.siteName}</strong>
        <span className="block text-sm text-muted-foreground">{settings.siteSubtitle}</span>
      </div>
    </div>
  );
}

function BrandImage({ settings }: { settings: SiteSettingsDto }) {
  if (settings.titleImageUrl) {
    return (
      <img
        alt={`${settings.siteName} 标题图片`}
        className="size-[42px] rounded-md object-cover shadow-sm ring-1 ring-sidebar-ring/25"
        src={settings.titleImageUrl}
      />
    );
  }

  return (
    <div className="brand-mark grid size-[42px] place-items-center rounded-md font-extrabold text-primary-foreground shadow-sm ring-1 ring-sidebar-ring/25">
      {settings.siteName.trim().charAt(0).toUpperCase() || "S"}
    </div>
  );
}
