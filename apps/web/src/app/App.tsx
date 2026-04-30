import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Cable,
  Database,
  FileSliders,
  KeyRound,
  RefreshCw,
  Server,
  ShieldCheck,
  Signal,
  TerminalSquare
} from "lucide-react";
import { getJson } from "./api";

type Dashboard = {
  totals: {
    sources: number;
    nodes: number;
    profiles: number;
    tokens: number;
  };
  recentEvents: Array<{
    id: string;
    title: string;
    status: "success" | "warning" | "error";
    time: string;
  }>;
};

const fallbackDashboard: Dashboard = {
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

const navigation = [
  { label: "概览", icon: Activity, active: true },
  { label: "订阅源", icon: Cable, active: false },
  { label: "节点", icon: Server, active: false },
  { label: "配置档", icon: FileSliders, active: false },
  { label: "令牌", icon: KeyRound, active: false },
  { label: "日志", icon: TerminalSquare, active: false }
];

const quickActions = [
  { label: "添加订阅源", icon: Cable },
  { label: "刷新节点", icon: RefreshCw },
  { label: "生成配置", icon: FileSliders }
];

export function App() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getJson<Dashboard>("/api/dashboard"),
    retry: false
  });

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => getJson<{ status: string; env: string }>("/api/health"),
    retry: false
  });

  const dashboard = dashboardQuery.data ?? fallbackDashboard;

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
            <button className={item.active ? "nav-item active" : "nav-item"} key={item.label}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Cloudflare Workers</p>
            <h1>订阅管理控制台</h1>
          </div>
          <div className="runtime-pill">
            <Signal size={16} />
            <span>{healthQuery.data?.status ?? "waiting"}</span>
          </div>
        </header>

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
                <button className="action-button" key={action.label}>
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
              <StorageItem label="Worker" value={healthQuery.data?.env ?? "local"} />
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
              {dashboard.recentEvents.map((event) => (
                <div className="event-item" key={event.id}>
                  <span className={`status-dot ${event.status}`} />
                  <strong>{event.title}</strong>
                  <time>{event.time}</time>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  icon: typeof Cable;
  tone: "green" | "blue" | "amber" | "rose";
};

function MetricCard({ label, value, icon: Icon, tone }: MetricCardProps) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
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
