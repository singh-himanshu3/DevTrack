import { IssuePriority, IssueStatus } from '../generated/prisma/client.js';
import { parsePositiveInteger } from './validation.js';

export interface IssueQuery {
  projectId?: number;
  assigneeId?: number | null;
  status?: IssueStatus;
  priority?: IssuePriority;
  search?: string;
  sort: 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

// Reject duplicate, nested and unknown parameters instead of silently widening a query.
export function parseIssueQuery(query: Record<string, unknown>): IssueQuery {
  const allowed = ['workspaceId', 'projectId', 'assigneeId', 'status', 'priority', 'search', 'sort', 'order', 'page', 'limit'];
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.includes(key) || typeof value !== 'string') throw new Error(`Invalid query parameter: ${key}`);
  }
  const result: IssueQuery = { sort: 'createdAt', order: 'desc', page: 1, limit: 20 };
  for (const key of ['projectId', 'assigneeId', 'page', 'limit'] as const) {
    const value = query[key];
    if (value === undefined) continue;
    if (key === 'assigneeId' && value === 'unassigned') { result.assigneeId = null; continue; }
    const parsed = parsePositiveInteger(value);
    if (parsed === null) throw new Error(`Invalid ${key}`);
    result[key] = parsed;
  }
  if (result.limit > 100 || (result.page - 1) * result.limit > 2147483647) throw new Error('Pagination is outside the supported range');
  if (query.status !== undefined) {
    if (!Object.values(IssueStatus).includes(query.status as IssueStatus)) throw new Error('Invalid status');
    result.status = query.status as IssueStatus;
  }
  if (query.priority !== undefined) {
    if (!Object.values(IssuePriority).includes(query.priority as IssuePriority)) throw new Error('Invalid priority');
    result.priority = query.priority as IssuePriority;
  }
  if (query.search !== undefined) {
    const search = (query.search as string).trim();
    if (search.length > 200 || /[\u0000-\u001f\u007f]/.test(search)) throw new Error('Search must be at most 200 characters without control characters');
    if (search) result.search = search;
  }
  if (query.sort !== undefined) {
    if (query.sort !== 'createdAt' && query.sort !== 'updatedAt') throw new Error('Invalid sort');
    result.sort = query.sort;
  }
  if (query.order !== undefined) {
    if (query.order !== 'asc' && query.order !== 'desc') throw new Error('Invalid order');
    result.order = query.order;
  }
  return result;
}
