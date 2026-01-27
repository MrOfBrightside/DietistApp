import { UserRole } from '../types/enums';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}
