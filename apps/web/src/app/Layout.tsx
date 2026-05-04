import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { LogOut, Moon, Signal, Sun } from "lucide-react";
import type { AuthUserDto, HealthDto, SiteSettingsDto } from "@smagicalsub/shared";
import { BrandHeader } from "../shared/BrandHeader";
import { navigation, type ModuleTone, type SectionId } from "./navigation";

type LayoutProps = {
  activeSection: SectionId;
  health?: HealthDto;
  settings: SiteSettingsDto;
  user?: AuthUserDto;
  children: ReactNode;
  theme: "dark" | "light";
  onLogout?: () => void;
  onSectionChange: (section: SectionId) => void;
  onThemeToggle: () => void;
};

export function Layout({ activeSection, health, settings, user, children, theme, onLogout, onSectionChange, onThemeToggle }: LayoutProps) {
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const visibleNavigation = navigation.filter((item) => user?.role === "admin" || !["settings", "users"].includes(item.id));
  const activeItem = navigation.find((item) => item.id === activeSection) ?? navigation[0];
  const ActiveIcon = activeItem.icon;

  return (
    <main className="app-shell min-h-screen">
      <aside className="sidebar-shell fixed inset-y-0 left-0 flex w-[284px] flex-col gap-6 overflow-y-auto border-r border-sidebar-border/80 px-4 py-5 max-[920px]:static max-[920px]:h-auto max-[920px]:w-auto max-[920px]:overflow-visible max-[920px]:border-r-0 max-[920px]:border-b">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/25 p-3">
          <BrandHeader settings={settings} />
        </div>

        <nav className="grid gap-1.5 max-[920px]:grid-cols-4 max-[560px]:grid-cols-2" aria-label="主导航">
          {visibleNavigation.map((item) => (
            <Button
              className={cn(
                "min-h-11 w-full justify-start gap-2.5 border-l-[3px] border-l-transparent bg-transparent px-3 text-sidebar-foreground/80 shadow-none hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground",
                item.id === activeSection && navToneClasses[item.tone].active
              )}
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              type="button"
              variant="ghost"
            >
              <item.icon className={cn(item.id === activeSection ? navToneClasses[item.tone].icon : "text-sidebar-foreground/65")} data-icon="inline-start" />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-sidebar-border/80 bg-sidebar-accent/20 p-3 text-sm ring-1 ring-sidebar-ring/10 max-[920px]:hidden">
          <p className="text-xs text-muted-foreground">本地验证通过后再部署到 Workers、D1 和 KV。</p>
        </div>
      </aside>

      <section className="relative ml-[284px] flex min-w-0 flex-col gap-5 px-6 py-5 max-[920px]:ml-0 max-[560px]:px-4">
        <div className="accent-strip h-1 rounded-full" aria-hidden="true" />
        <header className="flex items-center justify-between gap-4 border-b border-border/80 pb-3 max-[920px]:flex-col max-[920px]:items-start max-[560px]:items-start">
          <div className="flex min-w-0 items-center gap-3">
            <Badge className={cn("gap-1.5", navToneClasses[activeItem.tone].badge)} variant="outline">
              <ActiveIcon />
              {activeItem.label}
            </Badge>
            <span className="truncate text-sm text-muted-foreground">Cloudflare Workers / D1 / KV</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 max-[560px]:justify-start">
            <Badge className="h-9 gap-2 border-chart-3/25 bg-chart-3/10 px-3 text-chart-3" variant="outline">
              <Signal data-icon="inline-start" />
              <span>{health?.status ?? "waiting"}</span>
            </Badge>
            {user ? <Badge variant="secondary">{user.name ?? user.email}</Badge> : null}
            <Button aria-label="切换主题" onClick={onThemeToggle} type="button" variant="outline">
              <ThemeIcon data-icon="inline-start" />
              {theme === "dark" ? "白天" : "夜晚"}
            </Button>
            {onLogout ? (
              <Button onClick={onLogout} type="button" variant="outline">
                <LogOut data-icon="inline-start" />
                退出
              </Button>
            ) : null}
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}

const navToneClasses: Record<ModuleTone, { active: string; badge: string; icon: string }> = {
  amber: {
    active: "border-l-chart-4 bg-chart-4/10 text-sidebar-accent-foreground",
    badge: "border-chart-4/30 bg-chart-4/10 text-chart-4",
    icon: "text-chart-4"
  },
  blue: {
    active: "border-l-primary bg-primary/10 text-sidebar-accent-foreground",
    badge: "border-primary/30 bg-primary/10 text-primary",
    icon: "text-primary"
  },
  cyan: {
    active: "border-l-chart-2 bg-chart-2/10 text-sidebar-accent-foreground",
    badge: "border-chart-2/30 bg-chart-2/10 text-chart-2",
    icon: "text-chart-2"
  },
  green: {
    active: "border-l-chart-3 bg-chart-3/10 text-sidebar-accent-foreground",
    badge: "border-chart-3/30 bg-chart-3/10 text-chart-3",
    icon: "text-chart-3"
  },
  rose: {
    active: "border-l-destructive bg-destructive/10 text-sidebar-accent-foreground",
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: "text-destructive"
  }
};
