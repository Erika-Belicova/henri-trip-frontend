import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ActivityResponseDTO } from '../../../../../shared/interfaces/activity/activity-response-dto';
import { CATEGORY_LABELS } from '../../../../../shared/labels';

@Component({
  selector: 'app-activity-detail-admin',
  imports: [],
  templateUrl: './activity-detail-admin.html',
  styleUrl: './activity-detail-admin.scss',
})
export class ActivityDetailAdmin {

  categoryLabels = CATEGORY_LABELS;

  @Input({ required: true })
  activity!: ActivityResponseDTO;

  @Output()
  closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}