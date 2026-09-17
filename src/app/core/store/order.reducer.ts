import { createReducer, on } from '@ngrx/store';
import { Order } from '../models/order.model';
import * as OrderActions from './order.actions';

export interface OrderState {
  orders: Order[];
}

export const initialOrderState: OrderState = {
  orders: []
};

export const orderReducer = createReducer(
  initialOrderState,
  on(OrderActions.hydrateOrders, (_state, { orders }) => ({ orders })),
  on(OrderActions.placeOrder, (state, { order }) => ({
    orders: [order, ...state.orders]
  }))
);
