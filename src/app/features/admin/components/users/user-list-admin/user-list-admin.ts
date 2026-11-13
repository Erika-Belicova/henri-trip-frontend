import { Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Subject, catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';

import { UserService } from '../../../../../core/services/user.service';
import { GuideService } from '../../../../../core/services/guide.service';

import { UserResponseDTO } from '../../../../../shared/interfaces/user/user-response-dto';
import { GuideResponseDTO } from '../../../../../shared/interfaces/guide/guide-response-dto';
import { GuideInvitationResponseDTO } from '../../../../../shared/interfaces/guide/guide-invitation-response-dto';
import { toErrorMessage } from '../../../../../core/error-message';

interface UserAdminCard extends UserResponseDTO {
  guides: GuideResponseDTO[];
}

interface UserListState {
  users: UserAdminCard[];
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-user-list-admin',
  imports: [AsyncPipe, DatePipe, RouterLink],
  templateUrl: './user-list-admin.html',
  styleUrl: './user-list-admin.scss'
})
export class UserListAdmin {

  private readonly userService = inject(UserService);
  private readonly guideService = inject(GuideService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly reload$ = new Subject<void>();

  searchQuery = '';

  expandedUsers = new Set<number>();

  // user deletion confirmation modal
  showDeleteModal = false;
  isDeleting = false;
  deleteErrorMessage = '';
  
  selectedUser: UserResponseDTO | null = null;

  // load users and their assigned guides
  readonly userListState$ = this.reload$.pipe(
    startWith(undefined),

    switchMap(() => this.loadUsers()),

    takeUntilDestroyed(this.destroyRef)
  );

  private loadUsers() {
    return forkJoin({
      users: this.userService.getUsers(),
      firstPage: this.guideService.getGuides(0, 100)
    }).pipe(

      switchMap(({ users, firstPage }) => {

        // retrieve any remaining guide pages
        const remainingPages = Array.from(
          { length: Math.max(0, (firstPage.totalPages ?? 0) - 1) },
          (_, index) => index + 1
        );

        const pages$ = remainingPages.length > 0
          ? forkJoin(
              remainingPages.map(page =>
                this.guideService.getGuides(page, 100)
              )
            )
          : of([]);

        return pages$.pipe(
          map(pages => [
            ...firstPage.content,
            ...pages.flatMap(page => page.content)
          ]),
          switchMap(guides => {

            // retrieve assignments for every guide
            const invitations$ = guides.length > 0
              ? forkJoin(
                  guides.map(guide =>
                    this.guideService.getGuideInvitations(guide.id)
                  )
                )
              : of([] as GuideInvitationResponseDTO[][]);

            return invitations$.pipe(
              map(invitationGroups => {

                const invitations = invitationGroups.flat();

                const userCards: UserAdminCard[] = users.map(user => {

                  const assignedGuideIds = new Set(
                    invitations
                      .filter(invitation => invitation.userId === user.id)
                      .map(invitation => invitation.guideId)
                  );

                  return {
                    ...user,
                    guides: guides.filter(guide =>
                      assignedGuideIds.has(guide.id)
                    )
                  };
                });

                return {
                  users: userCards,
                  isLoading: false,
                  errorMessage: ''
                } satisfies UserListState;
              })
            );
          })
        );
      }),

      startWith({
        users: [],
        isLoading: true,
        errorMessage: ''
      } satisfies UserListState),

      catchError((err: unknown) => of({
        users: [],
        isLoading: false,
        errorMessage: toErrorMessage(err)
      } satisfies UserListState))
    );
  }

  // filter users by email
  filteredUsers(users: UserAdminCard[]): UserAdminCard[] {
    const query = this.searchQuery.trim().toLowerCase();

    return users.filter(user =>
      user.email.toLowerCase().includes(query)
    );
  }

  // toggle a user's guide accordion
  toggleGuides(userId: number): void {
    const updated = new Set(this.expandedUsers);

    if (updated.has(userId)) {
      updated.delete(userId);
    } else {
      updated.add(userId);
    }

    this.expandedUsers = updated;
  }

  // check whether the guide accordion is expanded
  isExpanded(userId: number): boolean {
    return this.expandedUsers.has(userId);
  }

  // open user deletion confirmation
  openDeleteModal(user: UserResponseDTO): void {
    this.selectedUser = user;
    this.deleteErrorMessage = '';
    this.showDeleteModal = true;
  }

  // close deletion confirmation
  closeDeleteModal(): void {
    if (this.isDeleting) return;

    this.showDeleteModal = false;
    this.selectedUser = null;
    this.deleteErrorMessage = '';
  }

  // delete user after confirmation
  deleteUser(): void {
    if (!this.selectedUser || this.isDeleting) return;

    this.isDeleting = true;
    this.deleteErrorMessage = '';

    this.userService.deleteUser(this.selectedUser.id).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.selectedUser = null;
        this.isDeleting = false;
        this.reload$.next();
      },
      error: (err: unknown) => {
        this.deleteErrorMessage = toErrorMessage(err);
        this.isDeleting = false;
      }
    });
  }

  // reload users after an operation
  loadUsersAgain(): void {
    this.reload$.next();
  }

  adminCount(users: UserAdminCard[]): number {
    return users.filter(user => user.role === 'ADMIN').length;
  }

}
