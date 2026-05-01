import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ModulePanelProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
  className?: string;
};

export function ModulePanel({ children, className, description, eyebrow, title }: ModulePanelProps) {
  return (
    <Card className={cn("col-span-full", className)}>
      <CardHeader>
        <p className="text-xs font-semibold text-muted-foreground">{eyebrow}</p>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}
