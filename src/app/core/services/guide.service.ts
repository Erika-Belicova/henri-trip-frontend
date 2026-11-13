import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { GuideRequestDTO } from '../../shared/interfaces/guide/guide-request-dto';
import { GuideUpdateRequestDTO } from '../../shared/interfaces/guide/guide-update-request-dto';
import { GuideResponseDTO } from '../../shared/interfaces/guide/guide-response-dto';
import { GuideDayResponseDTO } from '../../shared/interfaces/guide/guide-day-response-dto';
import { GuideInvitationResponseDTO } from '../../shared/interfaces/guide/guide-invitation-response-dto';
import { Page } from '../../shared/interfaces/page';

@Injectable({
  providedIn: 'root'
})
export class GuideService {

  private readonly apiUrl = `${environment.apiUrl}/guides`;

  constructor(private http: HttpClient) {}

  // retrieve a page of guides accessible to the authenticated user
  getGuides(page = 0, size = 20): Observable<Page<GuideResponseDTO>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'title,asc');

    return this.http.get<Page<GuideResponseDTO>>(
      this.apiUrl, { params }
    );
  }

  // retrieve a guide with its days and activities
  getGuideById(id: number | string): Observable<GuideResponseDTO> {
    return this.http.get<GuideResponseDTO>(
      `${this.apiUrl}/${id}`
    ).pipe(
      map(guide => this.sortItinerary(guide))
    );
  }

  // retrieve a specific day and its activities
  getGuideDay(
    guideId: number,
    dayId: number
  ): Observable<GuideDayResponseDTO> {
    return this.http.get<GuideDayResponseDTO>(
      `${this.apiUrl}/${guideId}/days/${dayId}`
    );
  }

  // create a guide
  createGuide(request: GuideRequestDTO): Observable<GuideResponseDTO> {
    return this.http.post<GuideResponseDTO>(
      this.apiUrl, request
    );
  }

  // update a guide
  updateGuide(
    id: number,
    request: GuideUpdateRequestDTO
  ): Observable<GuideResponseDTO> {
    return this.http.put<GuideResponseDTO>(
      `${this.apiUrl}/${id}`, request
    );
  }

  // delete a guide
  deleteGuide(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  // sort days and activities into their correct order
  private sortItinerary(guide: GuideResponseDTO): GuideResponseDTO {
    const days = [...(guide.days ?? [])]
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(day => ({
        ...day,
        activities: [...(day.activities ?? [])]
          .sort((a, b) => a.visitOrder - b.visitOrder)
      }));

    return { ...guide, days };
  }

  // retrieve all users assigned to a specific guide
  getGuideInvitations(
    guideId: number
  ): Observable<GuideInvitationResponseDTO[]> {
    return this.http.get<GuideInvitationResponseDTO[]>(
      `${this.apiUrl}/${guideId}/invitations`
    );
  }

}
