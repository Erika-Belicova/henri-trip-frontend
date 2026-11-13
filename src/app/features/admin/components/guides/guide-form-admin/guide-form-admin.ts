import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { GuideService } from '../../../../../core/services/guide.service';
import { toErrorMessage } from '../../../../../core/error-message';

import { GuideRequestDTO } from '../../../../../shared/interfaces/guide/guide-request-dto';
import { GuideUpdateRequestDTO } from '../../../../../shared/interfaces/guide/guide-update-request-dto';
import { GuideResponseDTO } from '../../../../../shared/interfaces/guide/guide-response-dto';

import { TransportOption } from '../../../../../shared/enumerations/transport-option';
import { SeasonOption } from '../../../../../shared/enumerations/season-option';
import { AudienceOption } from '../../../../../shared/enumerations/audience-option';

import {
  AUDIENCE_LABELS, AUDIENCE_OPTIONS, SEASON_LABELS,
  SEASON_OPTIONS, TRANSPORT_LABELS, TRANSPORT_OPTIONS
} from '../../../../../shared/labels';

@Component({
  selector: 'app-guide-form-admin',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './guide-form-admin.html',
  styleUrl: './guide-form-admin.scss',
})
export class GuideFormAdmin implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly guideService = inject(GuideService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  guideId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  // available enum values and their human-readable labels for the form
  transportOptions = TRANSPORT_OPTIONS;
  seasonOptions = SEASON_OPTIONS;
  audienceOptions = AUDIENCE_OPTIONS;

  transportLabels = TRANSPORT_LABELS;
  seasonLabels = SEASON_LABELS;
  audienceLabels = AUDIENCE_LABELS;

  // reactive form with validation matching the backend DTO constraints
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    numberOfDays: [1, [Validators.required, Validators.min(1)]],
    transports: this.fb.control<TransportOption[]>([], [Validators.required]),
    seasons: this.fb.control<SeasonOption[]>([], [Validators.required]),
    audiences: this.fb.control<AudienceOption[]>([], [Validators.required])
  });

  ngOnInit(): void {
    // an ID in the route indicates edit mode; otherwise, the form is used for creation
    const id = this.route.snapshot.paramMap.get('id');

    // Only load an existing guide when the route contains a valid numeric ID.
    if (id && Number.isInteger(Number(id)) && Number(id) > 0) {
      this.guideId = Number(id);
      this.isEditMode = true;
      this.loadGuide();
    }
  }

  // retrieve the existing guide and populate the form for editing
  loadGuide(): void {
    if (this.guideId === null) return;

    this.isLoading = true;

    this.guideService.getGuideById(this.guideId).subscribe({
      next: (guide: GuideResponseDTO) => {
        this.form.patchValue({
          title: guide.title,
          description: guide.description,
          numberOfDays: guide.numberOfDays,
          transports: guide.transports,
          seasons: guide.seasons,
          audiences: guide.audiences
        });

        this.isLoading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = toErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  // add or remove an option from the selected values of a filter group
  toggleOption<T>(controlName: 'transports' | 'seasons' | 'audiences', option: T): void {
    const control = this.form.get(controlName);
    if (!control) return;

    const selected = control.value as T[];

    const updated = selected.includes(option)
      ? selected.filter(value => value !== option)
      : [...selected, option];

    control.setValue(updated as TransportOption[] | SeasonOption[] | AudienceOption[]);
    control.markAsTouched();
  }

  // check whether an option is currently selected in a given form control
  isSelected<T>(
    controlName: 'transports' | 'seasons' | 'audiences',
    option: T
  ): boolean {
    const selected = this.form.get(controlName)?.value as T[] | null;
    return selected?.includes(option) ?? false;
  }

  // validate the form and call the appropriate API endpoint for creation or update
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    // retrieve the form values and choose the appropriate API operation
    const formValue = this.form.getRawValue();

    const operation = this.isEditMode && this.guideId !== null
      ? this.guideService.updateGuide(this.guideId, formValue as GuideUpdateRequestDTO)
      : this.guideService.createGuide(formValue as GuideRequestDTO);

    // navigate to the guide detail page after a successful save
    operation.subscribe({
      next: (guide: GuideResponseDTO) => {
        this.isSaving = false;
        this.router.navigate(['/admin/guides', guide.id]);
      },
      error: (err: unknown) => {
        this.errorMessage = toErrorMessage(err);
        this.isSaving = false;
      }
    });
  }

  // return to the guide list without saving changes
  cancel(): void {
    this.router.navigate(['/admin/guides']);
  }
}
