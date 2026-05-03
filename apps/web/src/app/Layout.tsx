import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { LogOut, Moon, Signal, Sun } from "lucide-react";
import type { AuthUserDto, HealthDto, SiteSettingsDto } from "@smagicalsub/shared";
import { BrandHeader } from "../shared/BrandHeader";
import { Eyebrow } from "../shared/Eyebrow";
import { navigation, type SectionId } from "./navigation";

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

const navToneClasses: Record<SectionId, string> = {
  dashboard: "text-chart-1",
  sources: "text-chart-2",
  nodes: "text-chart-5",
  profiles: "text-chart-3",
  tokens: "text-chart-4",
  logs: "text-primary",
  settings: "text-chart-3",
  users: "text-chart-5"
};

export function Layout({ activeSection, health, settings, user, children, theme, onLogout, onSectionChange, onThemeToggle }: LayoutProps) {
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const visibleNavigation = navigation.filter((item) => user?.role === "admin" || !["settings", "users"].includes(item.id));

  return (
    <main className="app-shell grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-[920px]:grid-cols-1">
      <aside className="sidebar-shell flex flex-col gap-7 border-r px-[18px] py-6 shadow-xl shadow-primary/5 max-[920px]:border-r-0 max-[920px]:border-b">
        <div className="rounded-xl border border-sidebar-border/80 bg-card/70 p-3 shadow-md ring-1 ring-sidebar-ring/15">
          <BrandHeader settings={settings} />
        </div>

        <nav className="grid gap-1.5 max-[920px]:grid-cols-4 max-[560px]:grid-cols-2" aria-label="主导航">
          {visibleNavigation.map((item) => (
            <Button
              className={cn(
                "min-h-10 w-full justify-start gap-2.5 border-l-[3px] border-l-transparent bg-card/25 px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                item.id === activeSection &&
                  "border-l-primary bg-sidebar-accent/90 text-sidebar-accent-foreground shadow-md ring-1 ring-sidebar-ring/30"
              )}
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              type="button"
              variant="ghost"
            >
              <item.icon className={navToneClasses[item.id]} data-icon="inline-start" />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </aside>

      <section className="flex flex-col gap-6 p-[26px] max-[560px]:p-[18px]">
        <div className="accent-strip h-1 rounded-full" aria-hidden="true" />
        <header className="flex items-center justify-between gap-4 rounded-xl border bg-card/80 px-4 py-3 shadow-md shadow-primary/5 ring-1 ring-primary/10 backdrop-blur max-[560px]:flex-col max-[560px]:items-start">
          <div>
            <Eyebrow className="text-primary">Cloudflare Workers</Eyebrow>
            <h1 className="text-3xl font-semibold leading-tight">订阅管理控制台</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 max-[560px]:justify-start">
            <Badge className="h-9 gap-2 border-primary/20 bg-primary/10 px-3 text-primary" variant="outline">
              <Signal data-icon="inline-start" />
              <span>{health?.status ?? "waiting"}</span>
            </Badge>
            {user ? <Badge variant="secondary">{user.name ?? user.email}</Badge> : null}
            <Button aria-label="切换主题" className="bg-card/70" onClick={onThemeToggle} type="button" variant="outline">
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
