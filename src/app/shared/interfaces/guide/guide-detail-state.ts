import { GuideResponseDTO } from './guide-response-dto';

export interface GuideDetailState {
  guide: GuideResponseDTO | null;
  isLoading: boolean;
  errorMessage: string;
}