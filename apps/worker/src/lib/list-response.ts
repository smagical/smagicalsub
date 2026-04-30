export type ListResponse<T> = {
  items: T[];
};

export function listResponse<T>(items: T[]): ListResponse<T> {
  return { items };
}

