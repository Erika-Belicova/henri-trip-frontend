import { ActivityCategory } from '../../enumerations/activity-category';

export interface ActivityRequestDTO {
  title: string;
  description: string;
  category: ActivityCategory;
  address: string;
  phoneNumber?: string | null;
  openingHours?: string | null;
  website?: string | null;
  visitOrder: number;
}
