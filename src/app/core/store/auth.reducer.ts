import { createReducer, on } from '@ngrx/store';
import { user } from '../models/user.models';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: user | null;
  isAuthenticated: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.hydrateAuth, (_state, { user: currentUser }) => ({
    user: currentUser,
    isAuthenticated: currentUser !== null
  })),
  on(AuthActions.loginSuccess, (_state, { user: currentUser }) => ({
    user: currentUser,
    isAuthenticated: true
  })),
  on(AuthActions.logout, () => initialAuthState)
);
