import { UserResponseDTO } from './user-response-dto';

export interface AuthResponseDTO {
  accessToken: string;
  tokenType: string;
  user: UserResponseDTO;
}