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
    <Card className="col-span-full bg-gradient-to-br from-card via-card to-chart-5/10 shadow-md shadow-primary/5">
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
            events.map((event, index) => (
              <div
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 shadow-sm max-[560px]:items-start max-[560px]:flex-col",
                  eventToneClass(event.status)
                )}
                key={event.id}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-background/70 font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <EventStatusBadge status={event.status} />
                <strong className="min-w-0 flex-1 truncate">{event.title}</strong>
                <time className="font-mono text-xs text-muted-foreground">{event.time}</time>
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
    return "border-chart-4/30 bg-gradient-to-r from-chart-4/15 via-chart-4/5 to-card";
  }

  return status === "warning"
    ? "border-chart-3/30 bg-gradient-to-r from-chart-3/15 via-chart-3/5 to-card"
    : "border-chart-2/30 bg-gradient-to-r from-chart-2/15 via-chart-2/5 to-card";
}

function EventStatusBadge({ status }: { status: DashboardDto["recentEvents"][number]["status"] }) {
  const variant = status === "error" ? "destructive" : status === "warning" ? "secondary" : "default";
  const label = status === "error" ? "失败" : status === "warning" ? "提醒" : "成功";

  return <Badge variant={variant}>{label}</Badge>;
}
