import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { catchError, map, of, startWith, switchMap, BehaviorSubject } from 'rxjs';

import { GuideService } from '../../../../../core/services/guide.service';
import { ActivityService } from '../../../../../core/services/activity.service';
import { toErrorMessage } from '../../../../../core/error-message';

import type { GuideDetailState } from './../../../../../shared/interfaces/guide/guide-detail-state';

import { ActivityResponseDTO } from '../../../../../shared/interfaces/activity/activity-response-dto';
import { GuideResponseDTO } from '../../../../../shared/interfaces/guide/guide-response-dto';

import { ActivityFormAdmin } from '../../activities/activity-form-admin/activity-form-admin';
import { ActivityDetailAdmin } from '../../activities/activity-detail-admin/activity-detail-admin';

import {
  TRANSPORT_LABELS, SEASON_LABELS, 
  AUDIENCE_LABELS, CATEGORY_LABELS
} from '../../../../../shared/labels';

// derive the guide day type from the guide response DTO
type GuideDay = GuideResponseDTO['days'][number];

@Component({
  selector: 'app-guide-detail-admin',
  imports: [
    AsyncPipe,
    RouterLink,
    DragDropModule,
    ActivityFormAdmin,
    ActivityDetailAdmin
  ],
  templateUrl: './guide-detail-admin.html',
  styleUrl: './guide-detail-admin.scss',
})
export class GuideDetailAdmin {

  private readonly guideService = inject(GuideService);
  private readonly activityService = inject(ActivityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly guideSubject =
    new BehaviorSubject<GuideResponseDTO | null>(null);

  readonly currentGuide$ = this.guideSubject.asObservable();

  transportLabels = TRANSPORT_LABELS;
  seasonLabels = SEASON_LABELS;
  audienceLabels = AUDIENCE_LABELS;
  categoryLabels = CATEGORY_LABELS;

  // control itinerary editing mode
  isItineraryEditMode = false;
  showLeaveEditConfirmation = false;

  // drag and drop state
  isMovingActivity = false;
  moveErrorMessage = '';

  // guide deletion modal
  showDeleteModal = false;
  isDeleting = false;
  deleteErrorMessage = '';

  // activity creation modal
  showActivityModal = false;
  selectedDayId: number | null = null;
  selectedVisitOrder = 0;

  // activity deletion modal
  showActivityDeleteModal = false;
  isDeletingActivity = false;
  activityDeleteErrorMessage = '';

  // activity detail modal
  selectedActivityDetails: ActivityResponseDTO | null = null;

  selectedActivity: {
    guideId: number;
    dayId: number;
    activityId: number;
    title: string;
  } | null = null;

  // retrieve the guide ID and load the corresponding guide
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

      return this.guideService.getGuideById(id).pipe(
        map((guide): GuideDetailState => {
          this.guideSubject.next(guide);

          return {
            guide,
            isLoading: false,
            errorMessage: ''
          };
        }),

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
    this.moveErrorMessage = '';
  }

  // open activity creation modal for the selected day
  openActivityModal(
    dayId: number,
    activities: ActivityResponseDTO[]
  ): void {
    if (!this.isItineraryEditMode || this.isMovingActivity) return;

    this.selectedDayId = dayId;

    this.selectedVisitOrder = activities.length > 0
      ? Math.max(...activities.map(activity => activity.visitOrder)) + 1
      : 1;

    this.showActivityModal = true;
  }

  // handle successful activity creation
  onActivityCreated(activity: ActivityResponseDTO): void {
    const guide = this.guideSubject.value;
    const dayId = this.selectedDayId;

    if (guide && dayId !== null) {
      const updatedGuide: GuideResponseDTO = {
        ...guide,
        days: guide.days.map(day =>
          day.id === dayId
            ? {
                ...day,
                activities: [...day.activities, activity]
                  .sort((a, b) => a.visitOrder - b.visitOrder)
              }
            : day
        )
      };

      this.guideSubject.next(updatedGuide);
    }

    this.closeActivityModal();
    this.selectedActivityDetails = activity;
  }

  // close activity creation modal
  closeActivityModal(): void {
    this.showActivityModal = false;
    this.selectedDayId = null;
  }

  // handle activity drag and drop
  dropActivity(
    event: CdkDragDrop<GuideDay, GuideDay, ActivityResponseDTO>,
    targetDayId: number
  ): void {

    if (
      !this.isItineraryEditMode ||
      this.isMovingActivity ||
      !event.previousContainer ||
      !event.container
    ) {
      return;
    }

    // ignore drops that do not change the position
    if (
      event.previousContainer === event.container &&
      event.previousIndex === event.currentIndex
    ) {
      return;
    }

    const guide = this.guideSubject.value;

    if (!guide) return;

    // keep the original guide so we can restore it if the API fails
    const originalGuide = guide;

    const sourceDayId = event.previousContainer.data.id;

    // create independent copies before changing the activity arrays
    const updatedDays: GuideDay[] = guide.days.map(day => ({
      ...day,
      activities: [...day.activities]
    }));

    const sourceDay = updatedDays.find(
      day => day.id === sourceDayId
    );

    const targetDay = updatedDays.find(
      day => day.id === targetDayId
    );

    if (!sourceDay || !targetDay) return;

    const movedActivity = sourceDay.activities[event.previousIndex];

    if (!movedActivity) return;

    // update the local itinerary immediately
    if (sourceDayId === targetDayId) {

      // reorder within the same day
      moveItemInArray(
        targetDay.activities,
        event.previousIndex,
        event.currentIndex
      );

    } else {

      // move between two different days
      transferArrayItem(
        sourceDay.activities,
        targetDay.activities,
        event.previousIndex,
        event.currentIndex
      );

      // recalculate the source day's order
      this.updateVisitOrders(sourceDay);
    }

    // recalculate the destination day's order
    this.updateVisitOrders(targetDay);

    // display the updated itinerary immediately
    this.guideSubject.next({
      ...guide,
      days: updatedDays
    });

    this.isMovingActivity = true;
    this.moveErrorMessage = '';

    // persist the change using the existing backend endpoint
    this.activityService.moveActivity(
      guide.id,
      sourceDayId,
      movedActivity.id,
      {
        targetDayId: targetDayId,
        visitOrder: event.currentIndex + 1
      }
    ).subscribe({

      next: (updatedActivity) => {

        // replace the moved activity with the server response
        const currentGuide = this.guideSubject.value;

        if (currentGuide) {
          const confirmedDays = currentGuide.days.map(day => {

            if (day.id !== targetDayId) return day;

            return {
              ...day,
              activities: day.activities
                .map(activity =>
                  activity.id === updatedActivity.id
                    ? updatedActivity
                    : activity
                )
                .sort((a, b) => a.visitOrder - b.visitOrder)
            };
          });

          this.guideSubject.next({
            ...currentGuide,
            days: confirmedDays
          });
        }

        this.isMovingActivity = false;
      },

      error: (err: unknown) => {

        // restore the original itinerary if the request fails
        this.guideSubject.next(originalGuide);

        this.moveErrorMessage = toErrorMessage(err);
        this.isMovingActivity = false;
      }
    });
  }

  // recalculate consecutive visit orders starting at 1
  private updateVisitOrders(day: GuideDay): void {
    day.activities = day.activities.map((activity, index) => ({
      ...activity,
      visitOrder: index + 1
    }));
  }

  // open confirmation modal before deleting the guide
  openDeleteModal(): void {
    this.deleteErrorMessage = '';
    this.showDeleteModal = true;
  }

  // close guide deletion modal
  closeDeleteModal(): void {
    if (this.isDeleting) return;

    this.showDeleteModal = false;
    this.deleteErrorMessage = '';
  }

  // delete guide and return to guide list
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
    if (!this.isItineraryEditMode || this.isMovingActivity) return;

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

  // refresh activities belonging to the affected day
  private refreshDayActivities(
    guideId: number,
    dayId: number
  ): void {
    this.activityService.getActivities(guideId, dayId).subscribe({
      next: (activities) => {
        const guide = this.guideSubject.value;

        if (!guide) return;

        const updatedGuide: GuideResponseDTO = {
          ...guide,
          days: guide.days.map(day =>
            day.id === dayId
              ? { ...day, activities }
              : day
          )
        };

        this.guideSubject.next(updatedGuide);

        this.isDeletingActivity = false;
        this.showActivityDeleteModal = false;
        this.selectedActivity = null;
      },

      error: (err: unknown) => {
        this.activityDeleteErrorMessage = toErrorMessage(err);
        this.isDeletingActivity = false;
      }
    });
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
        this.refreshDayActivities(guideId, dayId);
      },

      error: (err: unknown) => {
        this.activityDeleteErrorMessage = toErrorMessage(err);
        this.isDeletingActivity = false;
      }
    });
  }

  // open activity details
  openActivityDetails(activity: ActivityResponseDTO): void {
    this.selectedActivityDetails = activity;
  }

  // close activity details
  closeActivityDetails(): void {
    this.selectedActivityDetails = null;
  }
}
