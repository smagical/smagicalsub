import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Cable, FileSliders, RefreshCw } from "lucide-react";
import type { SectionId } from "../../app/navigation";
import { Eyebrow } from "../../shared/Eyebrow";
import { PageFeedback } from "../../shared/PageFeedback";

const quickActions = [
  { label: "添加订阅源", icon: Cable, target: "sources", tone: "source" },
  { label: "刷新节点", icon: RefreshCw, action: "refresh-sources", tone: "sync" },
  { label: "生成配置", icon: FileSliders, target: "profiles", tone: "profile" }
] satisfies Array<{
  action?: "refresh-sources";
  label: string;
  icon: typeof Cable;
  tone: "profile" | "source" | "sync";
  target?: SectionId;
}>;

const actionToneClasses: Record<(typeof quickActions)[number]["tone"], string> = {
  profile: "border-chart-3/30 bg-gradient-to-r from-chart-3/15 via-card to-card text-chart-3 hover:from-chart-3/20",
  source: "border-chart-2/30 bg-gradient-to-r from-chart-2/15 via-card to-card text-chart-2 hover:from-chart-2/20",
  sync: "border-chart-1/30 bg-gradient-to-r from-chart-1/15 via-card to-card text-chart-1 hover:from-chart-1/20"
};

type DashboardQuickActionsProps = {
  error: unknown;
  notice: string | null;
  pending: boolean;
  onNavigate: (section: SectionId) => void;
  onRefresh: () => void;
};

export function DashboardQuickActions({ error, notice, pending, onNavigate, onRefresh }: DashboardQuickActionsProps) {
  return (
    <Card className="bg-gradient-to-br from-card via-card to-chart-1/5">
      <CardHeader>
        <Eyebrow>Workflow</Eyebrow>
        <CardTitle>快速操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2.5 max-[920px]:grid-cols-1">
          {quickActions.map((action) => (
            <Button
              className={cn("justify-start", actionToneClasses[action.tone])}
              disabled={pending}
              key={action.label}
              onClick={() => runQuickAction(action, onNavigate, onRefresh)}
              type="button"
              variant="outline"
            >
              <action.icon data-icon="inline-start" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
        <PageFeedback error={error} notice={notice} />
      </CardContent>
    </Card>
  );
}

function runQuickAction(action: (typeof quickActions)[number], onNavigate: (section: SectionId) => void, onRefresh: () => void) {
  if (action.action === "refresh-sources") {
    onRefresh();
    return;
  }

  if (action.target) {
    onNavigate(action.target);
  }
}
