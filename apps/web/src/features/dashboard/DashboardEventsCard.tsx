import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardDto } from "@smagicalsub/shared";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";

type DashboardEventsCardProps = {
  events: DashboardDto["recentEvents"];
};

export function DashboardEventsCard({ events }: DashboardEventsCardProps) {
  return (
    <Card className="dashboard-card-wide">
      <CardHeader>
        <div>
          <p className="eyebrow">Events</p>
          <CardTitle>最近事件</CardTitle>
        </div>
        <CardAction>
          <ShieldCheck />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="event-list">
          {events.length === 0 ? (
            <EmptyState label="暂无事件" />
          ) : (
            events.map((event) => (
              <div className="event-item" key={event.id}>
                <EventStatusBadge status={event.status} />
                <strong>{event.title}</strong>
                <time>{event.time}</time>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EventStatusBadge({ status }: { status: DashboardDto["recentEvents"][number]["status"] }) {
  const variant = status === "error" ? "destructive" : status === "warning" ? "secondary" : "default";
  const label = status === "error" ? "失败" : status === "warning" ? "提醒" : "成功";

  return <Badge variant={variant}>{label}</Badge>;
}
