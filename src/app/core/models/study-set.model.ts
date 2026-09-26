export type StudySetVisibility = 'PUBLIC' | 'PRIVATE';

export interface Card {
  id: number;
  term: string;
  definition: string;
}

export interface StudySet {
  id: number;
  title: string;
  description: string | null;
  visibility: StudySetVisibility;
  owner: { id: number; fullName: string };
  /** Theo đúng thứ tự trong học phần. */
  cards: Card[];
  /** ISO-8601 timestamp. */
  createdAt: string;
  updatedAt: string;
}

export interface CardRequest {
  /** Thẻ đã có: gửi id để BE giữ nguyên thẻ đó khi sửa; null = thẻ mới. */
  id: number | null;
  term: string;
  definition: string;
}

/** Tạo / sửa học phần. Khi sửa, `cards` là toàn bộ thẻ theo thứ tự mới (thẻ cũ không có trong đây bị xoá). */
export interface StudySetRequest {
  title: string;
  description: string | null;
  visibility: StudySetVisibility;
  cards: CardRequest[];
}

/** 1 dòng trong danh sách học phần — không kèm thẻ, chỉ số thẻ. */
export interface StudySetSummary {
  id: number;
  title: string;
  description: string | null;
  visibility: StudySetVisibility;
  cardCount: number;
  /** ISO-8601 timestamp. */
  updatedAt: string;
}

/** RECENT: mới sửa trước (mặc định) · NEWEST: mới tạo trước · TITLE: A → Z. Khớp enum StudySetSort ở BE. */
export type StudySetSort = 'RECENT' | 'NEWEST' | 'TITLE';

export interface StudySetListParams {
  /** Tiêu đề chứa chuỗi này (không phân biệt hoa thường); rỗng = tất cả. */
  q: string;
  sort: StudySetSort;
  /** Bắt đầu từ 0. */
  page: number;
  size: number;
}
