
import { Component, ChangeDetectorRef, DestroyRef, EventEmitter, Output, inject, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { forkJoin, Subject, of } from 'rxjs';

import {
  catchError,
  finalize,
  startWith,
  switchMap
} from 'rxjs/operators';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserService } from '../../../../../core/services/user.service';
import { GuideService } from '../../../../../core/services/guide.service';

import { UserResponseDTO } from '../../../../../shared/interfaces/user/user-response-dto';
import { GuideInvitationResponseDTO } from '../../../../../shared/interfaces/guide/guide-invitation-response-dto';

import { toErrorMessage } from '../../../../../core/error-message';

@Component({
  selector: 'app-guide-invitations-admin',
  imports: [FormsModule],
  templateUrl: './guide-invitations-admin.html',
  styleUrl: './guide-invitations-admin.scss'
})
export class GuideInvitationsAdmin implements OnInit {

  private readonly userService = inject(UserService);
  private readonly guideService = inject(GuideService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly guideId = input.required<number>();

  @Output() closed = new EventEmitter<void>();

  users: UserResponseDTO[] = [];
  invitations: GuideInvitationResponseDTO[] = [];

  searchQuery = '';

  selectedUserIds = new Set<number>();
  selectedInvitationIds = new Set<number>();

  isLoading = true;
  isSending = false;
  isRemoving = false;

  errorMessage = '';
  successMessage = '';

  // emits whenever the user list and invitations need refreshing
  private readonly refresh$ = new Subject<void>();

  ngOnInit(): void {
    this.refresh$.pipe(
      // automatically load data when the component is initialized
      startWith(undefined),

      // cancel any previous request when a new refresh is triggered
      switchMap(() => {
        return forkJoin({
          users: this.userService.getUsers(),
          invitations: this.guideService.getGuideInvitations(this.guideId())
        }).pipe(
          catchError((err: unknown) => {
            console.error('REFRESH ERROR:', err);
            this.errorMessage = toErrorMessage(err);
            this.isLoading = false;
            return of(null);
          })
        );
      }),

      // unsubscribe automatically when the component is destroyed
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      if (!data) return;

      this.users = [...data.users];
      this.invitations = [...data.invitations];

      // identify users who have not yet been invited
      const availableIds = new Set(
        this.users
          .filter(user =>
            !this.invitations.some(
              invitation => invitation.userId === user.id
            )
          )
          .map(user => user.id)
      );

      // identify users who already have access
      const invitedIds = new Set(
        this.invitations.map(invitation => invitation.userId)
      );

      // remove selections that are no longer valid after refreshing
      this.selectedUserIds = new Set(
        [...this.selectedUserIds].filter(id => availableIds.has(id))
      );

      this.selectedInvitationIds = new Set(
        [...this.selectedInvitationIds].filter(id => invitedIds.has(id))
      );

      this.errorMessage = '';
      this.isLoading = false;

      // force the view to reflect the updated data
      this.cdr.detectChanges();
    });
  }

  // request a fresh copy of the users and invitations
  refreshData(): void {
    this.refresh$.next();
  }

  // return users who are not invited and match the email search
  get availableUsers(): UserResponseDTO[] {
    const invitedIds = new Set(
      this.invitations.map(invitation => invitation.userId)
    );

    const query = this.searchQuery.trim().toLowerCase();

    return this.users.filter(user =>
      !invitedIds.has(user.id) &&
      user.email.toLowerCase().includes(query)
    );
  }

  // toggle a user's selection for invitation
  toggleUser(userId: number): void {
    const updated = new Set(this.selectedUserIds);

    if (updated.has(userId)) {
      updated.delete(userId);
    } else {
      updated.add(userId);
    }

    this.selectedUserIds = updated;
  }

  // toggle a user's selection for removal
  toggleInvitation(userId: number): void {
    const updated = new Set(this.selectedInvitationIds);

    if (updated.has(userId)) {
      updated.delete(userId);
    } else {
      updated.add(userId);
    }

    this.selectedInvitationIds = updated;
  }

  // send invitations to all selected users
  sendInvitations(): void {
    if (this.isSending || this.selectedUserIds.size === 0) return;

    const userIds = [...this.selectedUserIds];

    this.isSending = true;
    this.errorMessage = '';
    this.successMessage = '';

    // wait until all invitation requests have completed
    forkJoin(
      userIds.map(userId =>
        this.guideService.inviteUser(this.guideId(), userId)
      )
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSending = false;
      })
    ).subscribe({
      next: () => {
        this.selectedUserIds.clear();
        this.successMessage = 'Les invitations ont été envoyées.';

        // reload the lists to reflect the new invitations
        this.refreshData();
      },
      error: (err: unknown) => {
        console.error('INVITATION ERROR:', err);
        this.errorMessage = toErrorMessage(err);
      }
    });
  }

  // remove access for all selected users
  removeSelectedInvitations(): void {
    if (this.isRemoving || this.selectedInvitationIds.size === 0) return;

    const userIds = [...this.selectedInvitationIds];

    this.isRemoving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // wait until all removal requests have completed
    forkJoin(
      userIds.map(userId =>
        this.guideService.removeInvitation(this.guideId(), userId)
      )
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isRemoving = false;
      })
    ).subscribe({
      next: () => {
        this.selectedInvitationIds.clear();
        this.successMessage = 'Les accès sélectionnés ont été supprimés.';

        // reload the lists to reflect the removed invitations
        this.refreshData();
      },
      error: (err: unknown) => {
        console.error('REMOVAL ERROR:', err);
        this.errorMessage = toErrorMessage(err);
      }
    });
  }

  // remove access for a single user
  removeInvitation(userId: number): void {
    if (this.isRemoving) return;

    this.isRemoving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.guideService.removeInvitation(
      this.guideId(),
      userId
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isRemoving = false;
      })
    ).subscribe({
      next: () => {
        this.selectedInvitationIds.delete(userId);
        this.successMessage = 'Accès supprimé.';

        // reload the lists to reflect the removed invitation
        this.refreshData();
      },
      error: (err: unknown) => {
        console.error('SINGLE REMOVAL ERROR:', err);
        this.errorMessage = toErrorMessage(err);
      }
    });
  }

  // notify the parent component that the modal should close
  close(): void {
    this.closed.emit();
  }
}
