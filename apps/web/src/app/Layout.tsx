import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Signal } from "lucide-react";
import type { HealthDto } from "@smagicalsub/shared";
import { Eyebrow } from "../shared/Eyebrow";
import { navigation, type SectionId } from "./navigation";

type LayoutProps = {
  activeSection: SectionId;
  health?: HealthDto;
  children: ReactNode;
  onSectionChange: (section: SectionId) => void;
};

export function Layout({ activeSection, health, children, onSectionChange }: LayoutProps) {
  return (
    <main className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-[920px]:grid-cols-1">
      <aside className="flex flex-col gap-7 border-r bg-sidebar px-[18px] py-6 max-[920px]:border-r-0 max-[920px]:border-b">
        <div className="flex items-center gap-3">
          <div className="grid size-[42px] place-items-center rounded-md bg-primary font-extrabold text-primary-foreground">S</div>
          <div>
            <strong className="block">smagicalsub</strong>
            <span className="block text-sm text-muted-foreground">Clash 订阅管理</span>
          </div>
        </div>

        <nav className="grid gap-1.5 max-[920px]:grid-cols-3" aria-label="主导航">
          {navigation.map((item) => (
            <Button
              className={cn("min-h-10 w-full justify-start gap-2.5 px-3", item.id === activeSection && "bg-accent text-accent-foreground")}
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

      <section className="flex flex-col gap-6 p-[26px] max-[560px]:p-[18px]">
        <header className="flex items-center justify-between gap-4 max-[560px]:flex-col max-[560px]:items-start">
          <div>
            <Eyebrow>Cloudflare Workers</Eyebrow>
            <h1 className="text-3xl font-semibold leading-tight">订阅管理控制台</h1>
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
