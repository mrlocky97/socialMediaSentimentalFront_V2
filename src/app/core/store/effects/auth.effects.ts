import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { AuthService, User } from '../../auth/services/auth.service';
import { UserProfile, UserProfileService } from '../../services/user-profile.service';
import * as AuthActions from '../actions/auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      mergeMap(() =>
        this.userProfileService.getProfile().pipe(
          // Map UserProfile -> AuthService.User
          map((profile: UserProfile) => {
            const user: User = {
              id: profile.id,
              email: profile.email,
              username: profile.username,
              displayName: profile.displayName || profile.username,
              firstName: profile.firstName,
              lastName: profile.lastName,
              bio: profile.bio as any,
              avatar: profile.avatar || null,
              role: profile.role as User['role'],
              permissions: profile.permissions || [],
              organizationId: profile.organizationId,
              organizationName: profile.organizationName,
              isActive: profile.isActive,
              isVerified: profile.isVerified,
              createdAt: typeof profile.createdAt === 'string' ? new Date(profile.createdAt) : (profile.createdAt as any),
              updatedAt: typeof profile.updatedAt === 'string' ? new Date(profile.updatedAt) : (profile.updatedAt as any)
            };
            return user;
          }),
          tap((user: User) => {
            // synchronize signals in AuthService so other parts still using signals stay consistent
            try { this.authService.currentUser.set(user); this.authService.isAuthenticated.set(true); } catch (e) { /* ignore if not available */ }
          }),
          map((user: User) => AuthActions.loadCurrentUserSuccess({ user })),
          catchError(error => of(AuthActions.loadCurrentUserFailure({ error })))
        )
      )
    )
  );
}
