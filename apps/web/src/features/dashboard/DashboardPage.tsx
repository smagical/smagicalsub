import type { DashboardDto, HealthDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { Cable, Database, FileSliders, KeyRound, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { MetricCard } from "../../shared/MetricCard";
import { getDashboard } from "./api";

const fallbackDashboard: DashboardDto = {
  totals: {
    sources: 0,
    nodes: 0,
    profiles: 0,
    tokens: 0
  },
  recentEvents: [
    {
      id: "init",
      title: "项目骨架已就绪，等待配置 D1/KV",
      status: "warning",
      time: "local"
    }
  ]
};

const quickActions = [
  { label: "添加订阅源", icon: Cable },
  { label: "刷新节点", icon: RefreshCw },
  { label: "生成配置", icon: FileSliders }
];

type DashboardPageProps = {
  health?: HealthDto;
};

export function DashboardPage({ health }: DashboardPageProps) {
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
              <button className="action-button" key={action.label} type="button">
                <action.icon size={18} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

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

        <div className="panel wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Events</p>
              <h2>最近事件</h2>
            </div>
            <ShieldCheck size={20} />
          </div>
          <div className="event-list">
            {dashboard.recentEvents.length === 0 ? (
              <EmptyState label="暂无事件" />
            ) : (
              dashboard.recentEvents.map((event) => (
                <div className="event-item" key={event.id}>
                  <span className={`status-dot ${event.status}`} />
                  <strong>{event.title}</strong>
                  <time>{event.time}</time>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
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

