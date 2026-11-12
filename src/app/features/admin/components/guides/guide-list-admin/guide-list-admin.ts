import { Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, startWith, switchMap, map, of } from 'rxjs';

import { GuideService } from '../../../../../core/services/guide.service';
import { toErrorMessage } from '../../../../../core/error-message';
import { GuideResponseDTO } from '../../../../../shared/interfaces/guide/guide-response-dto';
import type { GuideListState } from '../../../../../shared/interfaces/guide/guide-list-state';

import { TransportOption } from '../../../../../shared/enumerations/transport-option';
import { SeasonOption } from '../../../../../shared/enumerations/season-option';
import { AudienceOption } from '../../../../../shared/enumerations/audience-option';

import {
  AUDIENCE_LABELS, AUDIENCE_OPTIONS,
  SEASON_LABELS, SEASON_OPTIONS,
  TRANSPORT_LABELS, TRANSPORT_OPTIONS
} from '../../../../../shared/labels';

@Component({
  selector: 'app-guide-list-admin',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './guide-list-admin.html',
  styleUrl: './guide-list-admin.scss',
})
export class GuideListAdmin {

  currentPage = 0;
  pageSize = 20;

  searchQuery = '';
  selectedTransports = new Set<TransportOption>();
  selectedSeasons = new Set<SeasonOption>();
  selectedAudiences = new Set<AudienceOption>();

  transportLabels = TRANSPORT_LABELS;
  seasonLabels = SEASON_LABELS;
  audienceLabels = AUDIENCE_LABELS;

  transportOptions = TRANSPORT_OPTIONS;
  seasonOptions = SEASON_OPTIONS;
  audienceOptions = AUDIENCE_OPTIONS;

  private readonly guideService = inject(GuideService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload$ = new Subject<void>();

  // load guides automatically and whenever a reload is requested
  readonly guideListState$ = this.reload$.pipe(
    startWith(undefined),

    switchMap(() =>
      this.guideService.getGuides(this.currentPage, this.pageSize).pipe(

        // emit the successfully loaded guides and pagination information
        map((page): GuideListState => ({
          guides: page.content,
          isLoading: false,
          errorMessage: '',
          totalPages: page.totalPages ?? 0,
          totalElements: page.totalElements ?? 0
        })),

        // display the loading state while the request is running
        startWith({
          guides: [],
          isLoading: true,
          errorMessage: '',
          totalPages: 0,
          totalElements: 0
        }),

        // handle errors without terminating the reload stream
        catchError((err: unknown) => of({
          guides: [],
          isLoading: false,
          errorMessage: toErrorMessage(err),
          totalPages: 0,
          totalElements: 0
        }))
      )
    ),

    // automatically clean up when the component is destroyed
    takeUntilDestroyed(this.destroyRef)
  );

  // trigger a new request using the current pagination parameters
  loadGuides(): void {
    this.reload$.next();
  }

  // move to the previous page and reload the guides
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadGuides();
    }
  }

  // move to the next page and reload the guides
  nextPage(totalPages: number): void {
    if (this.currentPage + 1 < totalPages) {
      this.currentPage++;
      this.loadGuides();
    }
  }

  // filter guides by search text and selected filter options
  filteredGuides(guides: GuideResponseDTO[]): GuideResponseDTO[] {
    const query = this.searchQuery.trim().toLowerCase();

    return guides.filter((guide: GuideResponseDTO) =>
      (query === '' ||
        guide.title.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query)) &&
      (this.selectedTransports.size === 0 ||
        guide.transports.some((t: TransportOption) => this.selectedTransports.has(t))) &&
      (this.selectedSeasons.size === 0 ||
        guide.seasons.some((s: SeasonOption) => this.selectedSeasons.has(s))) &&
      (this.selectedAudiences.size === 0 ||
        guide.audiences.some((a: AudienceOption) => this.selectedAudiences.has(a)))
    );
  }

  // check whether any search or filter options are active
  get hasFilters(): boolean {
    return this.searchQuery.trim() !== '' ||
      this.selectedTransports.size > 0 ||
      this.selectedSeasons.size > 0 ||
      this.selectedAudiences.size > 0;
  }

  // update the search query when the user types
  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  // add or remove a value from a filter group
  toggle<T>(selected: Set<T>, value: T): void {
    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }
  }

  // reset the search query and all selected filters
  clearFilters(): void {
    this.searchQuery = '';
    this.selectedTransports.clear();
    this.selectedSeasons.clear();
    this.selectedAudiences.clear();
  }
}
