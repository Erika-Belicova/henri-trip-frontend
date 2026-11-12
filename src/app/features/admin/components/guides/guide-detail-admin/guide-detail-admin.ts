import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap, Subject } from 'rxjs';

import { GuideService } from '../../../../../core/services/guide.service';
import { ActivityService } from '../../../../../core/services/activity.service';
import { toErrorMessage } from '../../../../../core/error-message';

import type { GuideDetailState } from './../../../../../shared/interfaces/guide/guide-detail-state';

import { ActivityResponseDTO } from '../../../../../shared/interfaces/activity/activity-response-dto';
import { ActivityFormAdmin } from '../../activities/activity-form-admin/activity-form-admin';

import {
  TRANSPORT_LABELS, SEASON_LABELS,
  AUDIENCE_LABELS, CATEGORY_LABELS
} from '../../../../../shared/labels';

@Component({
  selector: 'app-guide-detail-admin',
  imports: [AsyncPipe, RouterLink, ActivityFormAdmin],
  templateUrl: './guide-detail-admin.html',
  styleUrl: './guide-detail-admin.scss',
})
export class GuideDetailAdmin {

  private readonly guideService = inject(GuideService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  transportLabels = TRANSPORT_LABELS;
  seasonLabels = SEASON_LABELS;
  audienceLabels = AUDIENCE_LABELS;
  categoryLabels = CATEGORY_LABELS;

  // control itinerary editing mode
  isItineraryEditMode = false;
  showLeaveEditConfirmation = false;

  // control the visibility and loading state of the deletion modal
  showDeleteModal = false;
  isDeleting = false;
  deleteErrorMessage = '';

  // activity creation modal
  showActivityModal = false;
  selectedDayId: number | null = null;
  selectedVisitOrder = 0;

  // activity deletion confirmation modal
  showActivityDeleteModal = false;
  isDeletingActivity = false;
  activityDeleteErrorMessage = '';

  selectedActivity: {
    guideId: number;
    dayId: number;
    activityId: number;
    title: string;
  } | null = null;

  private readonly activityService = inject(ActivityService);
  private readonly refreshGuide$ = new Subject<void>();

  // retrieve the guide ID from route changes and load the corresponding guide
  readonly guideState$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    map(id => Number(id)),
    switchMap(id => {
      if (!Number.isInteger(id) || id <= 0) {
        return of({
          guide: null,
          isLoading: false,
          errorMessage: 'Identifiant du guide invalide.'
        } satisfies GuideDetailState);
      }
      return this.refreshGuide$.pipe(
        startWith(undefined),
        switchMap(() => this.guideService.getGuideById(id).pipe(
          map((guide): GuideDetailState => ({
            guide,
            isLoading: false,
            errorMessage: ''
          })),

          startWith({
            guide: null,
            isLoading: true,
            errorMessage: ''
          }),

          catchError((err: unknown) => of({
            guide: null,
            isLoading: false,
            errorMessage: toErrorMessage(err)
          }))
        ))
      );
    })
  );

  // activate itinerary editing mode
  enterItineraryEditMode(): void {
    this.isItineraryEditMode = true;
  }

  // leave itinerary editing mode
  leaveItineraryEditMode(): void {
    this.isItineraryEditMode = false;
  }

  // open activity creation modal for the selected day
  openActivityModal(dayId: number, activities: ActivityResponseDTO[]): void {
    if (!this.isItineraryEditMode) return;

    this.selectedDayId = dayId;

    this.selectedVisitOrder = activities.length > 0
      ? Math.max(...activities.map(activity => activity.visitOrder)) + 1
      : 1; // order of the first activity

    this.showActivityModal = true;
  }

  // handle successful activity creation
  onActivityCreated(): void {
    this.closeActivityModal();
  }

  // close activity creation modal
  closeActivityModal(): void {
    this.showActivityModal = false;
    this.selectedDayId = null;
  }

  // open the confirmation modal before deleting the guide
  openDeleteModal(): void {
    this.deleteErrorMessage = '';
    this.showDeleteModal = true;
  }

  // close the modal without deleting the guide
  closeDeleteModal(): void {
    if (this.isDeleting) return;

    this.showDeleteModal = false;
    this.deleteErrorMessage = '';
  }

  // delete the guide after confirmation and return to the guide list
  deleteGuide(guideId: number): void {
    if (this.isDeleting) return;

    this.isDeleting = true;
    this.deleteErrorMessage = '';

    this.guideService.deleteGuide(guideId).subscribe({
      next: () => {
        this.router.navigate(['/admin/guides']);
      },
      error: (err: unknown) => {
        this.deleteErrorMessage = toErrorMessage(err);
        this.isDeleting = false;
      }
    });
  }

  // open confirmation modal before deleting an activity
  openActivityDeleteModal(
    guideId: number,
    dayId: number,
    activityId: number,
    title: string
  ): void {
    if (!this.isItineraryEditMode) return;

    this.selectedActivity = {
      guideId,
      dayId,
      activityId,
      title
    };

    this.activityDeleteErrorMessage = '';
    this.showActivityDeleteModal = true;
  }

  // close activity deletion modal
  closeActivityDeleteModal(): void {
    if (this.isDeletingActivity) return;

    this.showActivityDeleteModal = false;
    this.selectedActivity = null;
    this.activityDeleteErrorMessage = '';
  }

  // delete activity after confirmation
  deleteActivity(): void {
    if (this.isDeletingActivity || !this.selectedActivity) return;

    const { guideId, dayId, activityId } = this.selectedActivity;

    this.isDeletingActivity = true;
    this.activityDeleteErrorMessage = '';

    this.activityService.deleteActivity(
      guideId,
      dayId,
      activityId
    ).subscribe({
      next: () => {
        this.isDeletingActivity = false;
        this.showActivityDeleteModal = false;
        this.selectedActivity = null;

        // reload the guide and its itinerary
        this.refreshGuide$.next();
      },
      error: (err: unknown) => {
        this.activityDeleteErrorMessage = toErrorMessage(err);
        this.isDeletingActivity = false;
      }
    });
  }
}
