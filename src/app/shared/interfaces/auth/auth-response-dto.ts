import { UserResponseDTO } from '../user/user-response-dto';

export interface AuthResponseDTO {
  accessToken: string;
  tokenType: string;
  user: UserResponseDTO;
}