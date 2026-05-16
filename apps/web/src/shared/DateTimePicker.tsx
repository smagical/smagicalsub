import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarClock, ChevronLeft, ChevronRight, Clock3, Eraser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DateTimePickerProps = {
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];
const monthFormatter = new Intl.DateTimeFormat("zh-CN", { month: "long", year: "numeric" });

export function DateTimePicker({ ariaLabel, disabled, onChange, placeholder = "永不过期", value }: DateTimePickerProps) {
  const selectedDate = useMemo(() => parseDateTimeValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate]);
  const hourValue = pad(selectedDate?.getHours() ?? 23);
  const minuteValue = pad(selectedDate?.getMinutes() ?? 59);

  function updateSelectedDate(date: Date) {
    onChange(formatDateTimeValue(date));
  }

  function selectDay(day: number) {
    updateSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day, Number(hourValue), Number(minuteValue)));
  }

  function updateTime(part: "hour" | "minute", rawValue: string) {
    const fallback = selectedDate ?? new Date();
    const hour = part === "hour" ? clampTime(rawValue, 23) : Number(hourValue);
    const minute = part === "minute" ? clampTime(rawValue, 59) : Number(minuteValue);

    updateSelectedDate(new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate(), hour, minute));
  }

  function applyPreset(days: number) {
    const next = new Date();
    next.setDate(next.getDate() + days);
    next.setHours(23, 59, 0, 0);
    updateSelectedDate(next);
    setViewDate(next);
  }

  function changeMonth(offset: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn("w-full justify-start", !selectedDate && "text-muted-foreground")}
          disabled={disabled}
          type="button"
          variant="outline"
        >
          <CalendarClock data-icon="inline-start" />
          <span className="min-w-0 truncate">{selectedDate ? formatDisplayValue(selectedDate) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,360px)] p-0">
        <div className="border-b bg-muted/35 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold">选择过期时间</p>
              <p className="truncate text-xs text-muted-foreground">{selectedDate ? formatDisplayValue(selectedDate) : "当前为永不过期"}</p>
            </div>
            <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">
              本地时间
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <Button aria-label="上个月" onClick={() => changeMonth(-1)} size="icon-sm" type="button" variant="outline">
              <ChevronLeft />
            </Button>
            <strong className="font-mono text-sm">{monthFormatter.format(viewDate)}</strong>
            <Button aria-label="下个月" onClick={() => changeMonth(1)} size="icon-sm" type="button" variant="outline">
              <ChevronRight />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 rounded-lg border bg-background/70 p-2">
            {weekdayLabels.map((weekday) => (
              <span className="py-1 text-center text-[11px] font-semibold text-muted-foreground" key={weekday}>
                {weekday}
              </span>
            ))}
            {monthDays.map((day, index) =>
              day ? (
                <button
                  aria-pressed={isSameDay(selectedDate, viewDate, day)}
                  className={cn(
                    "h-8 rounded-lg border border-transparent font-mono text-xs transition-colors hover:border-primary/25 hover:bg-primary/10",
                    isToday(viewDate, day) && "border-chart-3/30 bg-chart-3/10 text-chart-3",
                    isSameDay(selectedDate, viewDate, day) && "border-primary bg-primary text-primary-foreground hover:bg-primary"
                  )}
                  key={`${viewDate.getFullYear()}-${viewDate.getMonth()}-${day}`}
                  onClick={() => selectDay(day)}
                  type="button"
                >
                  {day}
                </button>
              ) : (
                <span aria-hidden="true" className="h-8" key={`empty-${index}`} />
              )
            )}
          </div>

          <div className="grid gap-2 rounded-lg border bg-muted/20 p-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Clock3 />
              时间
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <Input aria-label={`${ariaLabel}小时`} max={23} min={0} onChange={(event) => updateTime("hour", event.target.value)} type="number" value={hourValue} />
              <span className="font-mono text-sm text-muted-foreground">:</span>
              <Input aria-label={`${ariaLabel}分钟`} max={59} min={0} onChange={(event) => updateTime("minute", event.target.value)} type="number" value={minuteValue} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => applyPreset(1)} size="sm" type="button" variant="outline">
              明天
            </Button>
            <Button onClick={() => applyPreset(7)} size="sm" type="button" variant="info">
              7 天
            </Button>
            <Button onClick={() => applyPreset(30)} size="sm" type="button" variant="success">
              30 天
            </Button>
          </div>

          <div className="flex justify-between gap-2 border-t pt-2">
            <Button onClick={() => onChange("")} size="sm" type="button" variant="ghost">
              <Eraser data-icon="inline-start" />
              永不过期
            </Button>
            <Button onClick={() => setOpen(false)} size="sm" type="button" variant="default">
              确定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function buildMonthDays(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  return [...Array.from({ length: offset }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
}

function parseDateTimeValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTimeValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplayValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isToday(viewDate: Date, day: number) {
  const today = new Date();

  return viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth() && day === today.getDate();
}

function isSameDay(selectedDate: Date | null, viewDate: Date, day: number) {
  return Boolean(
    selectedDate &&
      selectedDate.getFullYear() === viewDate.getFullYear() &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getDate() === day
  );
}

function clampTime(value: string, max: number) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), max);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
