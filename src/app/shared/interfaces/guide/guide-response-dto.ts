import { TransportOption } from '../../enumerations/transport-option';
import { SeasonOption } from '../../enumerations/season-option';
import { AudienceOption } from '../../enumerations/audience-option';
import { GuideDayResponseDTO } from './guide-day-response-dto';

export interface GuideResponseDTO {
  id: number;
  title: string;
  description: string;
  numberOfDays: number;
  transports: TransportOption[];
  seasons: SeasonOption[];
  audiences: AudienceOption[];
  days: GuideDayResponseDTO[];
  createdAt: string;
  updatedAt: string;
}