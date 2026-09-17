import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { OrderService } from '../../core/service/order.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  readonly order$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const orderId = params.get('id');
      return orderId ? this.orderService.getOrderById(orderId) : of(null);
    }),
    catchError(() => of(null))
  );
}