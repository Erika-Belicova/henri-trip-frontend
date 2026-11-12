import { TransportOption } from './enumerations/transport-option';
import { SeasonOption } from './enumerations/season-option';
import { AudienceOption } from './enumerations/audience-option';
import { ActivityCategory } from './enumerations/activity-category';

// display labels (French UI) for the backend enums
export const TRANSPORT_LABELS: Record<TransportOption, string> = {
  [TransportOption.CAR]: 'Voiture',
  [TransportOption.BICYCLE]: 'Vélo',
  [TransportOption.WALKING]: 'À pied',
  [TransportOption.MOTORCYCLE]: 'Moto'
};

export const SEASON_LABELS: Record<SeasonOption, string> = {
  [SeasonOption.SPRING]: 'Printemps',
  [SeasonOption.SUMMER]: 'Été',
  [SeasonOption.AUTUMN]: 'Automne',
  [SeasonOption.WINTER]: 'Hiver'
};

export const AUDIENCE_LABELS: Record<AudienceOption, string> = {
  [AudienceOption.FAMILY]: 'Famille',
  [AudienceOption.SOLO]: 'Seul',
  [AudienceOption.GROUP]: 'En groupe',
  [AudienceOption.FRIENDS]: 'Entre amis'
};

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  [ActivityCategory.MUSEUM]: 'Musée',
  [ActivityCategory.CASTLE]: 'Château',
  [ActivityCategory.ACTIVITY]: 'Activité',
  [ActivityCategory.PARK]: 'Parc',
  [ActivityCategory.CAVE]: 'Grotte'
};

export const TRANSPORT_OPTIONS = Object.values(TransportOption);
export const SEASON_OPTIONS = Object.values(SeasonOption);
export const AUDIENCE_OPTIONS = Object.values(AudienceOption);