import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { LogOut, Moon, Signal, Sun } from "lucide-react";
import type { HealthDto } from "@smagicalsub/shared";
import { Eyebrow } from "../shared/Eyebrow";
import { navigation, type SectionId } from "./navigation";

type LayoutProps = {
  activeSection: SectionId;
  health?: HealthDto;
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
  logs: "text-primary"
};

export function Layout({ activeSection, health, children, theme, onLogout, onSectionChange, onThemeToggle }: LayoutProps) {
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <main className="app-shell grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-[920px]:grid-cols-1">
      <aside className="sidebar-shell flex flex-col gap-7 border-r px-[18px] py-6 max-[920px]:border-r-0 max-[920px]:border-b">
        <div className="rounded-xl border border-sidebar-border/70 bg-card/55 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="brand-mark grid size-[42px] place-items-center rounded-md font-extrabold text-primary-foreground shadow-sm ring-1 ring-sidebar-ring/25">S</div>
            <div>
              <strong className="block">smagicalsub</strong>
              <span className="block text-sm text-muted-foreground">Clash 订阅管理</span>
            </div>
          </div>
        </div>

        <nav className="grid gap-1.5 max-[920px]:grid-cols-3" aria-label="主导航">
          {navigation.map((item) => (
            <Button
              className={cn(
                "min-h-10 w-full justify-start gap-2.5 border-l-[3px] border-l-transparent px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/70",
                item.id === activeSection &&
                  "border-l-primary bg-sidebar-accent/80 text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-ring/25"
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
        <header className="flex items-center justify-between gap-4 rounded-xl border bg-card/70 px-4 py-3 shadow-sm backdrop-blur max-[560px]:flex-col max-[560px]:items-start">
          <div>
            <Eyebrow className="text-primary">Cloudflare Workers</Eyebrow>
            <h1 className="text-3xl font-semibold leading-tight">订阅管理控制台</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="h-9 gap-2 border-primary/20 bg-primary/10 px-3 text-primary" variant="outline">
              <Signal data-icon="inline-start" />
              <span>{health?.status ?? "waiting"}</span>
            </Badge>
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
