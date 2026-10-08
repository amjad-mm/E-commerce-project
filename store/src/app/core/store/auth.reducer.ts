import { createReducer, on } from '@ngrx/store';
import { user } from '../models/user.models';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: user | null;
  isAuthenticated: boolean;
}

function getStoredUser(): user | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null;
    return raw ? (JSON.parse(raw) as user) : null;
  } catch {
    return null;
  }
}

const initialUser = getStoredUser();

export const initialAuthState: AuthState = {
  user: initialUser,
  isAuthenticated: initialUser !== null
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
  on(AuthActions.logout, () => ({
    user: null,
    isAuthenticated: false
  }))
);
