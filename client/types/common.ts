export interface ApiError {
  detail: string;
  status: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  sortBy: 'price' | 'name' | 'rating';
  order: 'asc' | 'desc';
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
