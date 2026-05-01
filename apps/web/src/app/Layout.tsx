import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Signal } from "lucide-react";
import type { HealthDto } from "@smagicalsub/shared";
import { navigation, type SectionId } from "./navigation";

type LayoutProps = {
  activeSection: SectionId;
  health?: HealthDto;
  children: ReactNode;
  onSectionChange: (section: SectionId) => void;
};

export function Layout({ activeSection, health, children, onSectionChange }: LayoutProps) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>smagicalsub</strong>
            <span>Clash 订阅管理</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="主导航">
          {navigation.map((item) => (
            <Button
              className={cn("nav-item", item.id === activeSection && "active")}
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              type="button"
              variant="ghost"
            >
              <item.icon data-icon="inline-start" />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Cloudflare Workers</p>
            <h1>订阅管理控制台</h1>
          </div>
          <Badge className="h-9 gap-2 px-3" variant="outline">
            <Signal data-icon="inline-start" />
            <span>{health?.status ?? "waiting"}</span>
          </Badge>
        </header>

        {children}
      </section>
    </main>
  );
}
