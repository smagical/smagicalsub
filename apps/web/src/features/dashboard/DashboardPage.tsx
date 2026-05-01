import { Button } from "@/components/ui/button";
import type { DashboardDto, HealthDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cable, Database, FileSliders, KeyRound, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { MetricCard } from "../../shared/MetricCard";
import { PageFeedback } from "../../shared/PageFeedback";
import type { SectionId } from "../../app/navigation";
import { refreshAllSources } from "../sources/api";
import { getDashboard } from "./api";

const fallbackDashboard: DashboardDto = { totals: { sources: 0, nodes: 0, profiles: 0, tokens: 0 }, recentEvents: [] };

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

type DashboardPageProps = { health?: HealthDto; onNavigate: (section: SectionId) => void };

export function DashboardPage({ health, onNavigate }: DashboardPageProps) {
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    retry: false
  });
  const refreshMutation = useMutation({
    mutationFn: refreshAllSources,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["sources"] }),
        queryClient.invalidateQueries({ queryKey: ["nodes"] })
      ]);
    }
  });

  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const refreshResult = refreshMutation.data;
  const refreshNotice = refreshResult
    ? `刷新完成：成功 ${refreshResult.success} 个，失败 ${refreshResult.failed} 个，解析 ${refreshResult.nodeCount} 个节点`
    : null;

  return (
    <div className="section-stack">
      <section className="metric-grid" aria-label="关键指标">
        <MetricCard label="订阅源" value={dashboard.totals.sources} icon={Cable} tone="green" />
        <MetricCard label="节点" value={dashboard.totals.nodes} icon={Server} tone="blue" />
        <MetricCard label="配置档" value={dashboard.totals.profiles} icon={FileSliders} tone="amber" />
        <MetricCard label="令牌" value={dashboard.totals.tokens} icon={KeyRound} tone="rose" />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2>快速操作</h2>
            </div>
          </div>
          <div className="action-row">
            {quickActions.map((action) => (
              <Button
                className="action-button"
                disabled={refreshMutation.isPending}
                key={action.label}
                onClick={() => runQuickAction(action, onNavigate, () => refreshMutation.mutate())}
                type="button"
                variant="outline"
              >
                <action.icon data-icon="inline-start" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>
          <PageFeedback error={refreshMutation.error} notice={refreshNotice} />
        </div>

        <StoragePanel health={health} />
        <EventsPanel events={dashboard.recentEvents} />
      </section>
    </div>
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

function StoragePanel({ health }: { health?: HealthDto }) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Storage</p>
          <h2>D1 / KV 状态</h2>
        </div>
        <Database size={20} />
      </div>
      <div className="storage-list">
        <StorageItem label="D1" value="业务主库、订阅源、节点、令牌" />
        <StorageItem label="KV" value="订阅配置缓存、上游原文缓存、限流计数" />
        <StorageItem label="Worker" value={health?.env ?? "local"} />
      </div>
    </div>
  );
}

function EventsPanel({ events }: { events: DashboardDto["recentEvents"] }) {
  return (
    <div className="panel wide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Events</p>
          <h2>最近事件</h2>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="event-list">
        {events.length === 0 ? (
          <EmptyState label="暂无事件" />
        ) : (
          events.map((event) => (
            <div className="event-item" key={event.id}>
              <span className={`status-dot ${event.status}`} />
              <strong>{event.title}</strong>
              <time>{event.time}</time>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StorageItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="storage-item">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}
