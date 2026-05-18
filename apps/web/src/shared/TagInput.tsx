import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState, type ClipboardEvent, type KeyboardEvent } from "react";

type TagInputProps = {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  suggestionsLabel?: string;
  value: string[];
};

export function TagInput({
  ariaLabel,
  className,
  disabled = false,
  inputClassName,
  onChange,
  placeholder,
  suggestions = [],
  suggestionsLabel = "推荐分组",
  value
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const valueKey = useMemo(() => value.join("\u0001"), [value]);
  const normalizedSuggestions = useMemo(() => normalizeTags(suggestions), [suggestions]);
  const visibleSuggestions = useMemo(() => {
    const keyword = draft.trim().toLowerCase();

    return normalizedSuggestions
      .filter((tag) => !value.includes(tag))
      .filter((tag) => keyword.length === 0 || tag.toLowerCase().includes(keyword))
      .slice(0, 16);
  }, [draft, normalizedSuggestions, value]);

  useEffect(() => {
    setDraft("");
    setSuggestionOpen(false);
  }, [valueKey]);

  const commitDraft = () => {
    const next = normalizeTags(splitTags(draft));

    if (next.length === 0) {
      setDraft("");
      return;
    }

    onChange(mergeTags(value, next));
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((current) => current !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
      return;
    }

    if (event.key === "Backspace" && draft.length === 0 && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    const next = normalizeTags(splitTags(`${draft}${pasted}`));

    if (next.length === 0) {
      return;
    }

    event.preventDefault();
    onChange(mergeTags(value, next));
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-8 min-w-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden rounded-lg border border-input bg-background/75 px-2 py-1 shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 dark:bg-input/20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {value.map((tag, index) => (
        <Badge
          className="flex h-6 max-w-full shrink-0 items-center gap-1 overflow-visible rounded-md border-border/70 bg-muted/35 px-2 py-0 text-xs font-normal text-foreground"
          key={`${tag}-${index}`}
          variant="outline"
        >
          <span className="max-w-full truncate">{tag}</span>
          <Button
            aria-label={`删除分组 ${tag}`}
            className="shrink-0"
            disabled={disabled}
            onClick={() => removeTag(tag)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <X data-icon="inline-start" />
          </Button>
        </Badge>
      ))}
      <Input
        aria-label={ariaLabel}
        className={cn(
          "h-6 min-w-[7rem] shrink-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent",
          inputClassName
        )}
        disabled={disabled}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        type="text"
        value={draft}
      />
      {normalizedSuggestions.length > 0 ? (
        <Popover open={suggestionOpen} onOpenChange={setSuggestionOpen}>
          <PopoverTrigger asChild>
            <Button
              aria-label={suggestionsLabel}
              className="shrink-0"
              disabled={disabled}
              size="icon-xs"
              title={suggestionsLabel}
              type="button"
              variant="ghost"
            >
              <Sparkles data-icon="inline-start" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="grid gap-0.5">
                  <span className="text-sm font-semibold">{suggestionsLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {draft.trim() ? `匹配 “${draft.trim()}” 的结果` : "点击即可快速添加"}
                  </span>
                </div>
                <Badge variant="outline">{visibleSuggestions.length}</Badge>
              </div>
              <div className="max-h-52 overflow-auto pr-1">
                <div className="grid gap-1">
                  {visibleSuggestions.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">没有可用建议，或已经全部添加。</div>
                  ) : (
                    visibleSuggestions.map((tag) => (
                      <button
                        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-background/70 px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/70"
                        key={tag}
                        onClick={() => {
                          onChange(mergeTags(value, [tag]));
                          setDraft("");
                          setSuggestionOpen(false);
                        }}
                        type="button"
                      >
                        <span className="truncate">{tag}</span>
                        <Badge variant="secondary">添加</Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

function splitTags(value: string) {
  return value
    .split(/[\r\n,，;；]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTags(tags: string[]) {
  return Array.from(new Set(tags));
}

function mergeTags(current: string[], next: string[]) {
  return normalizeTags([...current, ...next]);
}
