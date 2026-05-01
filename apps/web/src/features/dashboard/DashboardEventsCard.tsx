import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardDto } from "@smagicalsub/shared";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { Eyebrow } from "../../shared/Eyebrow";

type DashboardEventsCardProps = {
  events: DashboardDto["recentEvents"];
};

export function DashboardEventsCard({ events }: DashboardEventsCardProps) {
  return (
    <Card className="col-span-full">
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
              <div className="flex min-h-11 items-center gap-3 rounded-md bg-muted/50 px-3 py-2 max-[560px]:items-start max-[560px]:flex-col" key={event.id}>
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

function EventStatusBadge({ status }: { status: DashboardDto["recentEvents"][number]["status"] }) {
  const variant = status === "error" ? "destructive" : status === "warning" ? "secondary" : "default";
  const label = status === "error" ? "失败" : status === "warning" ? "提醒" : "成功";

  return <Badge variant={variant}>{label}</Badge>;
}
