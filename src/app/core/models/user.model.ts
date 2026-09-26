/** STUDENT: làm bài · ADMIN: soạn bộ đề, quản lý chủ đề. */
export type Role = 'STUDENT' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  /** ISO-8601 timestamp. */
  createdAt: string;
}
