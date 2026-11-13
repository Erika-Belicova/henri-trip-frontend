import { ActivityResponseDTO } from '../activity/activity-response-dto';

export interface GuideDayResponseDTO {
  id: number;
  dayNumber: number;
  activities: ActivityResponseDTO[];
  createdAt: string;
  updatedAt: string;
}