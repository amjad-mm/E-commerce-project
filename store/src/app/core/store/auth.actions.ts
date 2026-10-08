import { createAction, props } from '@ngrx/store';
import { user } from '../models/user.models';

export const hydrateAuth = createAction(
  '[Auth] Hydrate Auth',
  props<{ user: user | null }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: user }>()
);

export const logout = createAction('[Auth] Logout');
