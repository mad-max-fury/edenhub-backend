export interface IPaginationQuery {
  pageNumber: number;
  pageSize: number;
  orderBy?: string;
  searchTerm?: string;
}

export interface PaginationMetadata {
  pageSize: number;
  currentPage: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const getPaginationMetadata = (
  totalCount: number,
  pageNumber: number,
  pageSize: number,
): PaginationMetadata => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    pageSize,
    currentPage: pageNumber,
    totalCount,
    totalPages,
    hasPrevious: pageNumber > 1,
    hasNext: pageNumber < totalPages,
  };
};
