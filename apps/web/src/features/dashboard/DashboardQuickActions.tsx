import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cable, FileSliders, RefreshCw } from "lucide-react";
import type { SectionId } from "../../app/navigation";
import { PageFeedback } from "../../shared/PageFeedback";

const quickActions = [
  { label: "添加订阅源", icon: Cable, target: "sources" },
  { label: "刷新节点", icon: RefreshCw, action: "refresh-sources" },
  { label: "生成配置", icon: FileSliders, target: "profiles" }
] satisfies Array<{
  action?: "refresh-sources";
  label: string;
  icon: typeof Cable;
  target?: SectionId;
}>;

type DashboardQuickActionsProps = {
  error: unknown;
  notice: string | null;
  pending: boolean;
  onNavigate: (section: SectionId) => void;
  onRefresh: () => void;
};

export function DashboardQuickActions({ error, notice, pending, onNavigate, onRefresh }: DashboardQuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <p className="eyebrow">Workflow</p>
        <CardTitle>快速操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="dashboard-action-grid">
          {quickActions.map((action) => (
            <Button
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
