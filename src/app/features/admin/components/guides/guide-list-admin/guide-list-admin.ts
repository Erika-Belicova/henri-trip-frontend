import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GuideService } from '../../../../../core/services/guide.service';
import { toErrorMessage } from '../../../../../core/error-message';
import { GuideResponseDTO } from './../../../../../shared/interfaces/guide/guide-response-dto';
import { Page } from '../../../../../shared/interfaces/page';
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
  imports: [RouterLink],
  templateUrl: './guide-list-admin.html',
  styleUrl: './guide-list-admin.scss',
})
export class GuideListAdmin implements OnInit, OnDestroy {

  guides: GuideResponseDTO[] = [];
  isLoading = true;
  errorMessage = '';

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

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

  private subscription: Subscription | null = null;

  private guideService = inject(GuideService);

  ngOnInit(): void {
    this.loadGuides();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // fetch a page of guides accessible to the authenticated administrator
  loadGuides(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.subscription?.unsubscribe();

    this.subscription = this.guideService
      .getGuides(this.currentPage, this.pageSize)
      .subscribe({
        next: (page: Page<GuideResponseDTO>) => {
          this.guides = page.content;
          this.totalPages = page.totalPages ?? 0;
          this.totalElements = page.totalElements ?? 0;
          this.isLoading = false;
        },
        error: (err: unknown) => {
          this.errorMessage = toErrorMessage(err);
          this.isLoading = false;
        }
      });
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadGuides();
    }
  }

  nextPage(): void {
    if (this.currentPage + 1 < this.totalPages) {
      this.currentPage++;
      this.loadGuides();
    }
  }

  // search matches title or description, filters combine across groups
  get filteredGuides(): GuideResponseDTO[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.guides.filter((guide: GuideResponseDTO) =>
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

  get hasFilters(): boolean {
    return this.searchQuery.trim() !== '' ||
      this.selectedTransports.size > 0 ||
      this.selectedSeasons.size > 0 ||
      this.selectedAudiences.size > 0;
  }

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

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedTransports.clear();
    this.selectedSeasons.clear();
    this.selectedAudiences.clear();
  }

}
