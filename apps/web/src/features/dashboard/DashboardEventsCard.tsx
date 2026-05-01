import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardDto } from "@smagicalsub/shared";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { Eyebrow } from "../../shared/Eyebrow";

type DashboardEventsCardProps = {
  events: DashboardDto["recentEvents"];
};

export function DashboardEventsCard({ events }: DashboardEventsCardProps) {
  return (
    <Card className="col-span-full bg-gradient-to-br from-card via-card to-chart-5/5">
      <CardHeader>
        <div>
          <Eyebrow>Events</Eyebrow>
          <CardTitle>最近事件</CardTitle>
        </div>
        <CardAction>
          <ShieldCheck />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2.5">
          {events.length === 0 ? (
            <EmptyState label="暂无事件" />
          ) : (
            events.map((event) => (
              <div
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md border-l-[3px] px-3 py-2 max-[560px]:items-start max-[560px]:flex-col",
                  eventToneClass(event.status)
                )}
                key={event.id}
              >
                <EventStatusBadge status={event.status} />
                <strong>{event.title}</strong>
                <time className="ml-auto text-sm text-muted-foreground max-[560px]:ml-0">{event.time}</time>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function eventToneClass(status: DashboardDto["recentEvents"][number]["status"]) {
  if (status === "error") {
    return "border-l-chart-4 bg-gradient-to-r from-chart-4/15 via-chart-4/5 to-card";
  }

  return status === "warning"
    ? "border-l-chart-3 bg-gradient-to-r from-chart-3/15 via-chart-3/5 to-card"
    : "border-l-chart-2 bg-gradient-to-r from-chart-2/15 via-chart-2/5 to-card";
}

function EventStatusBadge({ status }: { status: DashboardDto["recentEvents"][number]["status"] }) {
  const variant = status === "error" ? "destructive" : status === "warning" ? "secondary" : "default";
  const label = status === "error" ? "失败" : status === "warning" ? "提醒" : "成功";

  return <Badge variant={variant}>{label}</Badge>;
}
