import type { Request } from 'express';

export interface ListParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  q: string | undefined;
  sortField: string | undefined;
  sortDir: 'asc' | 'desc';
  filters: Record<string, string>;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

/**
 * Parse standard list query params:
 *   ?page=1&pageSize=20&sort=fullName:asc&q=search&<filterKey>=<value>
 * Server-side pagination, sorting and filtering are enforced everywhere; the
 * client cannot request more than MAX_PAGE_SIZE rows.
 */
export function parseListParams(
  req: Request,
  opts: { sortable: string[]; filterable?: string[]; defaultSort?: string } = { sortable: [] },
): ListParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE));

  const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;

  let sortField: string | undefined;
  let sortDir: 'asc' | 'desc' = 'asc';
  const rawSort = (typeof req.query.sort === 'string' && req.query.sort) || opts.defaultSort;
  if (rawSort) {
    const [field, dir] = rawSort.split(':');
    if (opts.sortable.includes(field)) {
      sortField = field;
      sortDir = dir === 'desc' ? 'desc' : 'asc';
    }
  }

  const filters: Record<string, string> = {};
  for (const key of opts.filterable ?? []) {
    const v = req.query[key];
    if (typeof v === 'string' && v.trim() && v !== 'all' && v !== 'All') {
      filters[key] = v.trim();
    }
  }

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
    q,
    sortField,
    sortDir,
    filters,
  };
}

export interface PagedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function pagedResult<T>(data: T[], total: number, params: ListParams): PagedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  return {
    data,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export function orderByOrDefault(
  params: ListParams,
  fallback: Record<string, 'asc' | 'desc'>,
): Record<string, 'asc' | 'desc'> {
  if (params.sortField) return { [params.sortField]: params.sortDir };
  return fallback;
}
