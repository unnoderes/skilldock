import React, { FormEvent, useMemo, useState } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import type { LogsPagination } from "@skilldock/shared";

type PaginationLabels = {
  first: string;
  previous: string;
  next: string;
  last: string;
  jumpTo: string;
  go: string;
  page: string;
  of: string;
  total: string;
  showing: string;
  to: string;
  items: string;
};

function buildPageNumbers(page: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 3);
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  return Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({
  pagination,
  labels,
  onPageChange,
}: {
  pagination: LogsPagination;
  labels: PaginationLabels;
  onPageChange: (page: number) => void;
}) {
  const [targetPage, setTargetPage] = useState(String(pagination.page));
  const { page, pageSize, totalItems, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const pages = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  React.useEffect(() => {
    setTargetPage(String(page));
  }, [page]);

  const submitTargetPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number.parseInt(targetPage, 10);
    if (!Number.isFinite(parsed)) {
      setTargetPage(String(page));
      return;
    }
    onPageChange(Math.min(Math.max(parsed, 1), Math.max(totalPages, 1)));
  };

  const buttonClass = (active = false) =>
    `inline-flex h-8 min-w-8 items-center justify-center px-2 rounded-lg border text-xs font-bold transition-colors ${
      active
        ? "bg-accent text-white border-accent"
        : "border-border text-text-muted hover:text-text hover:bg-surface-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
    }`;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-surface-800">
      <div className="text-xs text-text-muted">
        {labels.total} <span className="font-bold text-text">{totalItems}</span> {labels.items}
        <span className="mx-2 text-border">|</span>
        {labels.showing} <span className="font-bold text-text">{firstItem}</span> {labels.to}{" "}
        <span className="font-bold text-text">{lastItem}</span> {labels.of}{" "}
        <span className="font-bold text-text">{totalItems}</span> {labels.items}
        <span className="mx-2 text-border">|</span>
        {labels.page} <span className="font-bold text-text">{page}</span> {labels.of}{" "}
        <span className="font-bold text-text">{Math.max(totalPages, 1)}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
        <button type="button" className={buttonClass()} onClick={() => onPageChange(1)} disabled={!hasPreviousPage} aria-label={labels.first} title={labels.first}>
          <ChevronsLeft size={14} />
        </button>
        <button type="button" className={buttonClass()} onClick={() => onPageChange(page - 1)} disabled={!hasPreviousPage} aria-label={labels.previous} title={labels.previous}>
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((pageNumber, index) => {
            const previous = pages[index - 1];
            return (
              <React.Fragment key={pageNumber}>
                {previous !== undefined && pageNumber - previous > 1 && (
                  <span className="px-1 text-xs text-text-muted">...</span>
                )}
                <button type="button" className={buttonClass(pageNumber === page)} onClick={() => onPageChange(pageNumber)} aria-current={pageNumber === page ? "page" : undefined}>
                  {pageNumber}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <button type="button" className={buttonClass()} onClick={() => onPageChange(page + 1)} disabled={!hasNextPage} aria-label={labels.next} title={labels.next}>
          <ChevronRight size={14} />
        </button>
        <button type="button" className={buttonClass()} onClick={() => onPageChange(Math.max(totalPages, 1))} disabled={!hasNextPage} aria-label={labels.last} title={labels.last}>
          <ChevronsRight size={14} />
        </button>

        <form className="flex items-center gap-2 pl-1 shrink-0" onSubmit={submitTargetPage}>
          <label className="text-xs text-text-muted whitespace-nowrap shrink-0" htmlFor="logs-page-jump">{labels.jumpTo}</label>
          <input
            id="logs-page-jump"
            type="number"
            min={1}
            max={Math.max(totalPages, 1)}
            value={targetPage}
            onChange={(event) => setTargetPage(event.target.value)}
            className="h-8 w-16 !w-16 rounded-lg bg-surface-900 border border-border px-2 text-xs outline-none focus:ring-1 focus:ring-accent shrink-0"
          />
          <button type="submit" className={`${buttonClass()} shrink-0`}>{labels.go}</button>
        </form>
      </div>
    </div>
  );
}
