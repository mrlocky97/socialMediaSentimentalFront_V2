import { createReducer, on } from '@ngrx/store';
import { User } from '../../auth/services/auth.service';
import * as AuthActions from '../actions/auth.actions';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: any | null;
}

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.loadCurrentUser, (state: AuthState): AuthState => ({ ...state, loading: true, error: null })),
  on(AuthActions.loadCurrentUserSuccess, (state: AuthState, { user }: { user: User }): AuthState => ({ ...state, loading: false, user })),
  on(AuthActions.loadCurrentUserFailure, (state: AuthState, { error }: { error: any }): AuthState => ({ ...state, loading: false, error }))
);
