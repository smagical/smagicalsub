import type { DashboardDto, HealthDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { Cable, Database, FileSliders, KeyRound, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { MetricCard } from "../../shared/MetricCard";
import type { SectionId } from "../../app/navigation";
import { getDashboard } from "./api";

const fallbackDashboard: DashboardDto = {
  totals: {
    sources: 0,
    nodes: 0,
    profiles: 0,
    tokens: 0
  },
  recentEvents: []
};

const quickActions = [
  { label: "添加订阅源", icon: Cable, target: "sources" },
  { label: "刷新节点", icon: RefreshCw, target: "nodes" },
  { label: "生成配置", icon: FileSliders, target: "profiles" }
] satisfies Array<{
  label: string;
  icon: typeof Cable;
  target: SectionId;
}>;

type DashboardPageProps = {
  health?: HealthDto;
  onNavigate: (section: SectionId) => void;
};

export function DashboardPage({ health, onNavigate }: DashboardPageProps) {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    retry: false
  });

  const dashboard = dashboardQuery.data ?? fallbackDashboard;

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
              <button className="action-button" key={action.label} onClick={() => onNavigate(action.target)} type="button">
                <action.icon size={18} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <StoragePanel health={health} />
        <EventsPanel events={dashboard.recentEvents} />
      </section>
    </div>
  );
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
