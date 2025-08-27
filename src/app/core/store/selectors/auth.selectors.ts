import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../reducers/auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (s: AuthState) => s.user);
export const selectAuthLoading = createSelector(selectAuthState, (s: AuthState) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s: AuthState) => s.error);
