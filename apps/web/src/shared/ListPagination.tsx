import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListPaginationProps = {
  className?: string;
  currentPage: number;
  label: string;
  onPageChange: (page: number) => void;
  pageCount: number;
  total: number;
};

export function ListPagination({ className, currentPage, label, onPageChange, pageCount, total }: ListPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/75 px-3 py-2", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{label}</span>
        <Badge variant="outline">
          第 {currentPage} / {pageCount} 页
        </Badge>
        <span>共 {total} 条</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
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
