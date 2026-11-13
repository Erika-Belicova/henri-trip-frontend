import { TransportOption } from '../../enumerations/transport-option';
import { SeasonOption } from '../../enumerations/season-option';
import { AudienceOption } from '../../enumerations/audience-option';

export interface GuideRequestDTO {
  title: string;
  description: string;
  numberOfDays: number;
  transports: TransportOption[];
  seasons: SeasonOption[];
  audiences: AudienceOption[];
}
