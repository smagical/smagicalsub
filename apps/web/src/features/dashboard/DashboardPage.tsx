import type { DashboardDto, HealthDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SectionId } from "../../app/navigation";
import { refreshAllSources } from "../sources/api";
import { getDashboard } from "./api";
import { DashboardEventsCard } from "./DashboardEventsCard";
import { DashboardMetrics } from "./DashboardMetrics";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { DashboardStorageCard } from "./DashboardStorageCard";

const fallbackDashboard: DashboardDto = { totals: { sources: 0, nodes: 0, profiles: 0, tokens: 0 }, recentEvents: [] };

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
    <div className="grid gap-[18px]">
      <DashboardMetrics totals={dashboard.totals} />
      <section className="grid items-stretch grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-3.5 max-[920px]:grid-cols-1">
        <DashboardQuickActions
          error={refreshMutation.error}
          notice={refreshNotice}
          pending={refreshMutation.isPending}
          requestStats={dashboard.requestStats}
          totals={dashboard.totals}
          onNavigate={onNavigate}
          onRefresh={() => refreshMutation.mutate()}
        />
        <DashboardStorageCard health={health} requestStats={dashboard.requestStats} totals={dashboard.totals} />
        <DashboardEventsCard events={dashboard.recentEvents} />
      </section>
    </div>
  );
}
