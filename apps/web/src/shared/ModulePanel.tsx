import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ModuleTone } from "../app/navigation";

type ModulePanelProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
  className?: string;
  tone?: ModuleTone;
};

export function ModulePanel({ children, className, description, eyebrow, title, tone = "cyan" }: ModulePanelProps) {
  const toneClass = moduleToneClasses[tone];

  return (
    <section className={cn("col-span-full flex flex-col gap-4", className)}>
      <header className={cn("module-panel-header border-l-[5px]", toneClass.header)}>
        <div className="grid gap-2">
          <Badge className={cn("w-fit", toneClass.badge)} variant="outline">
            {eyebrow}
          </Badge>
          <div className="grid gap-1">
            <h2 className="text-3xl font-semibold leading-tight max-[560px]:text-2xl">{title}</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

const moduleToneClasses: Record<ModuleTone, { badge: string; header: string }> = {
  amber: {
    badge: "border-chart-4/30 bg-chart-4/10 text-chart-4",
    header: "border-l-chart-4"
  },
  blue: {
    badge: "border-primary/30 bg-primary/10 text-primary",
    header: "border-l-primary"
  },
  cyan: {
    badge: "border-chart-2/30 bg-chart-2/10 text-chart-2",
    header: "border-l-chart-2"
  },
  green: {
    badge: "border-chart-3/30 bg-chart-3/10 text-chart-3",
    header: "border-l-chart-3"
  },
  rose: {
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
    header: "border-l-destructive"
  }
};
