import { UserRole } from '../../enumerations/user-role';

export interface UserResponseDTO {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}