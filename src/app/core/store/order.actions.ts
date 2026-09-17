import { createAction, props } from '@ngrx/store';
import { Order } from '../models/order.model';

export const hydrateOrders = createAction(
  '[Order] Hydrate Orders',
  props<{ orders: Order[] }>()
);

export const placeOrder = createAction(
  '[Order] Place Order',
  props<{ order: Order }>()
);
