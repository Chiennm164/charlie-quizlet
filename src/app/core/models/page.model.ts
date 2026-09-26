/** 1 trang kết quả từ BE (PageResponse). `page` bắt đầu từ 0. */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
