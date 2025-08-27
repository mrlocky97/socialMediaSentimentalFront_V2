import { createAction, props } from '@ngrx/store';
import { User } from '../../auth/services/auth.service';

export const loadCurrentUser = createAction('[Auth] Load Current User');
export const loadCurrentUserSuccess = createAction('[Auth] Load Current User Success', props<{ user: User }>());
export const loadCurrentUserFailure = createAction('[Auth] Load Current User Failure', props<{ error: any }>());
