import { GuideResponseDTO } from './guide-response-dto';

// represents the different states of the guide loading request
export interface GuideListState {
  guides: GuideResponseDTO[];
  isLoading: boolean;
  errorMessage: string;
  totalPages: number;
  totalElements: number;
}