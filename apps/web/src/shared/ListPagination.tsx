import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { useEffect, useState, type FormEvent } from "react";

type ListPaginationProps = {
  className?: string;
  currentPage: number;
  label: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageCount: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  total: number;
};

export function ListPagination({
  className,
  currentPage,
  label,
  onPageChange,
  onPageSizeChange,
  pageCount,
  pageSize,
  pageSizeOptions,
  total
}: ListPaginationProps) {
  const canChangePageSize = Boolean(onPageSizeChange && pageSize && pageSizeOptions?.length);
  const [jumpPage, setJumpPage] = useState(String(currentPage));

  useEffect(() => {
    setJumpPage(String(currentPage));
  }, [currentPage]);

  if (pageCount <= 1 && !canChangePageSize) {
    return null;
  }

  function handleJumpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetPage = Number.parseInt(jumpPage, 10);
    if (!Number.isFinite(targetPage)) {
      setJumpPage(String(currentPage));
      return;
    }

    const nextPage = Math.min(Math.max(targetPage, 1), pageCount);
    setJumpPage(String(nextPage));
    onPageChange(nextPage);
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/75 px-3 py-2", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{label}</span>
          <Badge variant="outline">
            第 {currentPage} / {pageCount} 页
          </Badge>
          <span>共 {total} 条</span>
        </div>
        {canChangePageSize ? (
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>每页</span>
            <NativeSelect
              aria-label={`${label}每页数量`}
              className="h-7 w-20 text-xs"
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
              value={String(pageSize)}
            >
              {pageSizeOptions?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {pageCount > 1 ? (
          <>
            <Button disabled={currentPage === 1} onClick={() => onPageChange(1)} size="xs" type="button" variant="outline">
              首页
            </Button>
            <Button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} size="xs" type="button" variant="outline">
              上一页
            </Button>
            {renderPageButtons(currentPage, pageCount, onPageChange)}
            <Button disabled={currentPage === pageCount} onClick={() => onPageChange(currentPage + 1)} size="xs" type="button" variant="outline">
              下一页
            </Button>
            <Button disabled={currentPage === pageCount} onClick={() => onPageChange(pageCount)} size="xs" type="button" variant="outline">
              末页
            </Button>
            <form className="flex items-center gap-1.5" onSubmit={handleJumpSubmit}>
              <span className="text-xs text-muted-foreground">跳至</span>
              <Input
                aria-label={`${label}跳转页码`}
                className="h-7 w-16 px-2 text-xs"
                max={pageCount}
                min={1}
                onChange={(event) => setJumpPage(event.target.value)}
                type="number"
                value={jumpPage}
              />
              <Button size="xs" type="submit" variant="outline">
                跳转
              </Button>
            </form>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">已显示全部</span>
        )}
      </div>
    </div>
  );
}

function renderPageButtons(currentPage: number, pageCount: number, onPageChange: (page: number) => void) {
  const pages = buildPages(currentPage, pageCount);

  return pages.map((page, index) =>
    page === "ellipsis" ? (
      <span aria-hidden="true" className="px-1 text-xs text-muted-foreground" key={`ellipsis-${index}`}>
        ...
      </span>
    ) : (
      <Button
        aria-current={page === currentPage ? "page" : undefined}
        disabled={page === currentPage}
        key={page}
        onClick={() => onPageChange(page)}
        size="xs"
        type="button"
        variant={page === currentPage ? "default" : "outline"}
      >
        {page}
      </Button>
    )
  );
}

function buildPages(currentPage: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", pageCount];
  }

  if (currentPage >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", pageCount];
}
