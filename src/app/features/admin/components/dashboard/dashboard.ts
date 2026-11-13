import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { forkJoin, map, catchError, of, startWith } from 'rxjs';

import { GuideService } from '../../../../core/services/guide.service';
import { UserService } from '../../../../core/services/user.service';

interface DashboardState {
  totalGuides: number;
  totalUsers: number;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  private readonly guideService = inject(GuideService);
  private readonly userService = inject(UserService);

  readonly dashboardState$ = forkJoin({
    guides: this.guideService.getGuides(0, 1),
    users: this.userService.getUsers()
  }).pipe(
    map(({ guides, users }): DashboardState => ({
      totalGuides: guides.totalElements ?? guides.content.length,
      totalUsers: users.length,
      isLoading: false,
      errorMessage: ''
    })),

    startWith({
      totalGuides: 0,
      totalUsers: 0,
      isLoading: true,
      errorMessage: ''
    } satisfies DashboardState),

    catchError(() => of({
      totalGuides: 0,
      totalUsers: 0,
      isLoading: false,
      errorMessage: 'Impossible de charger les statistiques du tableau de bord.'
    } satisfies DashboardState))
  );
}
