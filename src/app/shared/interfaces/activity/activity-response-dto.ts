import { ActivityCategory } from '../../enumerations/activity-category';

export interface ActivityResponseDTO {
  id: number;
  title: string;
  description: string;
  category: ActivityCategory;
  address: string;
  phoneNumber: string | null;
  openingHours: string | null;
  website: string | null;
  visitOrder: number;
  createdAt: string;
  updatedAt: string;
}