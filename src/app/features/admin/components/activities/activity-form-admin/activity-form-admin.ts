
import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivityService } from '../../../../../core/services/activity.service';
import { toErrorMessage } from '../../../../../core/error-message';

import { ActivityCategory } from '../../../../../shared/enumerations/activity-category';
import { ActivityRequestDTO } from '../../../../../shared/interfaces/activity/activity-request-dto';
import { ActivityResponseDTO } from '../../../../../shared/interfaces/activity/activity-response-dto';

import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '../../../../../shared/labels';

@Component({
  selector: 'app-activity-form-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './activity-form-admin.html',
  styleUrl: './activity-form-admin.scss',
})
export class ActivityFormAdmin {

  private readonly fb = inject(FormBuilder);
  private readonly activityService = inject(ActivityService);

  // the parent provides the guide and day in which the activity will be created
  guideId = input.required<number>();
  dayId = input.required<number>();
  visitOrder = input.required<number>();

  // notify the parent when creation succeeds or the form is cancelled
  activityCreated = output<ActivityResponseDTO>();
  cancelled = output<void>();

  categoryOptions = CATEGORY_OPTIONS;
  categoryLabels = CATEGORY_LABELS;

  isSaving = false;
  errorMessage = '';

  // form validation follows the backend ActivityRequestDTO constraints
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    category: [null as ActivityCategory | null, [Validators.required]],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    phoneNumber: ['', [Validators.maxLength(50)]],
    openingHours: ['', [Validators.maxLength(500)]],
    website: ['', [Validators.maxLength(2048)]]
  });

  // validate and submit the activity to its selected guide day
  onSubmit(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const formValue = this.form.getRawValue();

    const request: ActivityRequestDTO = {
      title: formValue.title!.trim(),
      description: formValue.description!.trim(),
      category: formValue.category!,
      address: formValue.address!.trim(),
      phoneNumber: formValue.phoneNumber?.trim() || null,
      openingHours: formValue.openingHours?.trim() || null,
      website: formValue.website?.trim() || null,
      visitOrder: this.visitOrder()
    };

    this.activityService.createActivity(
      this.guideId(),
      this.dayId(),
      request
    ).subscribe({
      next: (activity: ActivityResponseDTO) => {
        this.isSaving = false;
        this.activityCreated.emit(activity);
      },
      error: (err: unknown) => {
        this.errorMessage = toErrorMessage(err);
        this.isSaving = false;
      }
    });
  }

  // notify the parent that the user wants to close the form
  cancel(): void {
    if (this.isSaving) return;

    this.cancelled.emit();
  }
}
