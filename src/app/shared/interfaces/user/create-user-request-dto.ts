import { UserRole } from '../../enumerations/user-role';

export interface CreateUserRequestDTO {
  email: string;
  password: string;
  role: UserRole;
}
