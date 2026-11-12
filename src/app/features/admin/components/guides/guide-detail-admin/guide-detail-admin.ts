import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { GuideService } from '../../../../../core/services/guide.service';
import { toErrorMessage } from '../../../../../core/error-message';

import { GuideResponseDTO } from '../../../../../shared/interfaces/guide/guide-response-dto';

import {
  TRANSPORT_LABELS, SEASON_LABELS,
  AUDIENCE_LABELS, CATEGORY_LABELS
} from '../../../../../shared/labels';

interface GuideDetailState {
  guide: GuideResponseDTO | null;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-guide-detail-admin',
  imports: [AsyncPipe, RouterLink],
  templateUrl: './guide-detail-admin.html',
  styleUrl: './guide-detail-admin.scss',
})
export class GuideDetailAdmin {

  private readonly guideService = inject(GuideService);
  private readonly route = inject(ActivatedRoute);

  transportLabels = TRANSPORT_LABELS;
  seasonLabels = SEASON_LABELS;
  audienceLabels = AUDIENCE_LABELS;
  categoryLabels = CATEGORY_LABELS;

  // retrieve the guide ID from the route and load the corresponding guide
  readonly guideState$ = of(this.route.snapshot.paramMap.get('id')).pipe(
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
}
