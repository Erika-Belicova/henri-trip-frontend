
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ActivityResponseDTO } from '../../shared/interfaces/activity/activity-response-dto';
import { ActivityRequestDTO } from '../../shared/interfaces/activity/activity-request-dto';
import { MoveActivityRequestDTO } from '../../shared/interfaces/activity/move-activity-request-dto';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/guides`;

  // retrieve all activities belonging to a specific guide day
  getActivities(guideId: number, dayId: number): Observable<ActivityResponseDTO[]> {
    return this.http.get<ActivityResponseDTO[]>(
      `${this.apiUrl}/${guideId}/days/${dayId}/activities`
    );
  }

  // retrieve a specific activity from a guide day
  getActivity(
    guideId: number,
    dayId: number,
    activityId: number
  ): Observable<ActivityResponseDTO> {
    return this.http.get<ActivityResponseDTO>(
      `${this.apiUrl}/${guideId}/days/${dayId}/activities/${activityId}`
    );
  }

  // create an activity within a specific guide day
  createActivity(
    guideId: number,
    dayId: number,
    request: ActivityRequestDTO
  ): Observable<ActivityResponseDTO> {
    return this.http.post<ActivityResponseDTO>(
      `${this.apiUrl}/${guideId}/days/${dayId}/activities`,
      request
    );
  }

  // delete an activity from a guide day
  deleteActivity(
    guideId: number,
    dayId: number,
    activityId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${guideId}/days/${dayId}/activities/${activityId}`
    );
  }

  // move an activity to another guide day and visit order
  moveActivity(
    guideId: number,
    dayId: number,
    activityId: number,
    request: MoveActivityRequestDTO
  ): Observable<ActivityResponseDTO> {
    return this.http.patch<ActivityResponseDTO>(
      `${this.apiUrl}/${guideId}/days/${dayId}/activities/${activityId}/move`,
      request
    );
  }
}
