import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { GuideService } from '../../../../core/services/guide.service';
import { toErrorMessage } from '../../../../core/error-message';

import type { GuideDetailState } from '../../../../shared/interfaces/guide/guide-detail-state';
import { ActivityResponseDTO } from '../../../../shared/interfaces/activity/activity-response-dto';

import { ActivityDetailAdmin } from '../../../admin/components/activities/activity-detail-admin/activity-detail-admin';

import {
  TRANSPORT_LABELS,
  SEASON_LABELS,
  AUDIENCE_LABELS
} from '../../../../shared/labels';

@Component({
  selector: 'app-guide-detail',
  imports: [
    AsyncPipe,
    RouterLink,
    ActivityDetailAdmin
  ],
  templateUrl: './guide-detail.html',
  styleUrl: './guide-detail.scss',
})
export class GuideDetail {

  private readonly guideService = inject(GuideService);
  private readonly route = inject(ActivatedRoute);

  transportLabels = TRANSPORT_LABELS;
  seasonLabels = SEASON_LABELS;
  audienceLabels = AUDIENCE_LABELS;

  selectedActivityDetails: ActivityResponseDTO | null = null;

  // retrieve the guide ID and load the corresponding guide
  readonly guideState$ = this.route.paramMap.pipe(
    map(params => params.get('id')),

    switchMap(id => {
      const guideId = Number(id);

      if (!Number.isInteger(guideId) || guideId <= 0) {
        return of({
          guide: null,
          isLoading: false,
          errorMessage: 'Identifiant du guide invalide.'
        } satisfies GuideDetailState);
      }

      return this.guideService.getGuideById(guideId).pipe(

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
      );
    })
  );

  // open activity details
  openActivityDetails(activity: ActivityResponseDTO): void {
    this.selectedActivityDetails = activity;
  }

  // close activity details
  closeActivityDetails(): void {
    this.selectedActivityDetails = null;
  }
}
