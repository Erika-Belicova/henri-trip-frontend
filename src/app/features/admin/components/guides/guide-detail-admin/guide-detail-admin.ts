import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { GuideService } from '../../../../../core/services/guide.service';
import { toErrorMessage } from '../../../../../core/error-message';

import type { GuideDetailState } from './../../../../../shared/interfaces/guide/guide-detail-state';

import {
  TRANSPORT_LABELS, SEASON_LABELS,
  AUDIENCE_LABELS, CATEGORY_LABELS
} from '../../../../../shared/labels';

@Component({
  selector: 'app-guide-detail-admin',
  imports: [AsyncPipe, RouterLink],
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

  // control the visibility and loading state of the deletion modal
  showDeleteModal = false;
  isDeleting = false;
  deleteErrorMessage = '';

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

      return this.guideService.getGuideById(id).pipe(
        map((guide): GuideDetailState => ({
          guide,
          isLoading: false,
          errorMessage: ''
        })),

        // show a loading state while retrieving the guide
        startWith({
          guide: null,
          isLoading: true,
          errorMessage: ''
        }),

        // display an error if the request fails
        catchError((err: unknown) => of({
          guide: null,
          isLoading: false,
          errorMessage: toErrorMessage(err)
        }))
      );
    })
  );

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
}
