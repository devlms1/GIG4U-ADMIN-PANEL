/**
 * Calculates pagination skip value from page and limit.
 */
export const calculateSkip = (page: number, limit: number): number =>
  (page - 1) * limit;

/**
 * Creates a standardized pagination meta object.
 */
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number,
) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});
