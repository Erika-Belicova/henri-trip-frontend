import { Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, startWith, switchMap, map, of } from 'rxjs';

import { GuideService } from '../../../../core/services/guide.service';
import { toErrorMessage } from '../../../../core/error-message';
import { GuideResponseDTO } from '../../../../shared/interfaces/guide/guide-response-dto';
import type { GuideListState } from '../../../../shared/interfaces/guide/guide-list-state';

import { TransportOption } from '../../../../shared/enumerations/transport-option';
import { SeasonOption } from '../../../../shared/enumerations/season-option';
import { AudienceOption } from '../../../../shared/enumerations/audience-option';

import {
  AUDIENCE_LABELS, AUDIENCE_OPTIONS,
  SEASON_LABELS, SEASON_OPTIONS,
  TRANSPORT_LABELS, TRANSPORT_OPTIONS
} from '../../../../shared/labels';

@Component({
  selector: 'app-guide-list-user',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './guide-list.html',
  styleUrl: './guide-list.scss'
})
export class GuideList {

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

  readonly guideListState$ = this.reload$.pipe(
    startWith(undefined),

    switchMap(() =>
      this.guideService.getGuides(this.currentPage, this.pageSize).pipe(

        map((page): GuideListState => ({
          guides: page.content,
          isLoading: false,
          errorMessage: '',
          totalPages: page.totalPages ?? 0,
          totalElements: page.totalElements ?? 0
        })),

        startWith({
          guides: [],
          isLoading: true,
          errorMessage: '',
          totalPages: 0,
          totalElements: 0
        }),

        catchError((err: unknown) => of({
          guides: [],
          isLoading: false,
          errorMessage: toErrorMessage(err),
          totalPages: 0,
          totalElements: 0
        }))
      )
    ),

    takeUntilDestroyed(this.destroyRef)
  );

  loadGuides(): void {
    this.reload$.next();
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadGuides();
    }
  }

  nextPage(totalPages: number): void {
    if (this.currentPage + 1 < totalPages) {
      this.currentPage++;
      this.loadGuides();
    }
  }

  filteredGuides(guides: GuideResponseDTO[]): GuideResponseDTO[] {
    const query = this.searchQuery.trim().toLowerCase();

    return guides.filter(guide =>
      (query === '' ||
        guide.title.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query)) &&

      (this.selectedTransports.size === 0 ||
        guide.transports.some(t => this.selectedTransports.has(t))) &&

      (this.selectedSeasons.size === 0 ||
        guide.seasons.some(s => this.selectedSeasons.has(s))) &&

      (this.selectedAudiences.size === 0 ||
        guide.audiences.some(a => this.selectedAudiences.has(a)))
    );
  }

  get hasFilters(): boolean {
    return this.searchQuery.trim() !== '' ||
      this.selectedTransports.size > 0 ||
      this.selectedSeasons.size > 0 ||
      this.selectedAudiences.size > 0;
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  toggle<T>(selected: Set<T>, value: T): void {
    if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedTransports.clear();
    this.selectedSeasons.clear();
    this.selectedAudiences.clear();
  }
}
