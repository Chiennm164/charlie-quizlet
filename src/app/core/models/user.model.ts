export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'LOCKED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  /** ISO-8601 timestamp. */
  createdAt: string;
}
