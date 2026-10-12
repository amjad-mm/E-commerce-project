import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, UpperCasePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { OrderService } from '../../../core/service/order.service';
import { Order } from '../../../core/models/order.model';
import { CartItem } from '../../../core/models/cart.model';
import { NotificationService } from '../../../core/service/notification.service';

@Component({
  selector: 'app-admin-order-details',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, UpperCasePipe, NgClass, FormsModule],
  templateUrl: './admin-order-details.component.html',
  styleUrl: './admin-order-details.component.css'
})
export class AdminOrderDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);

  orderId = '';
  order: Order | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Status update modal state
  isStatusModalOpen = false;
  selectedNewStatus: Order['status'] = 'placed';

  readonly statusOptions: Array<Order['status']> = [
    'placed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ];

  readonly fallbackImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23ece6da"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="9" fill="%23888888">NO IMAGE</text></svg>';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId = id;
      this.loadOrder(id);
    } else {
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = 'No valid order ID was provided in the route parameters.';
    }
  }

  loadOrder(id: string): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.orderService.getOrderById(id).pipe(
      catchError((err) => {
        console.error('Failed to load order details for admin:', err);
        this.hasError = true;
        this.errorMessage = `Could not retrieve Order #${id}. Verify json-server is active on port 3000.`;
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        this.order = data;
        if (data) {
          this.selectedNewStatus = data.status;
        }
        this.isLoading = false;
      }
    });
  }

  getItemSubtotal(item: CartItem): number {
    return (item.product?.price || 0) * (item.quantity || 1);
  }

  getTotalItemsCount(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  openStatusModal(): void {
    if (this.order) {
      this.selectedNewStatus = this.order.status;
      this.isStatusModalOpen = true;
    }
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
  }

  confirmStatusUpdate(): void {
    if (!this.order) return;

    const targetOrder = this.order;
    const newStatus = this.selectedNewStatus;

    this.orderService.updateOrderStatus(targetOrder.id, newStatus).subscribe({
      next: () => {
        targetOrder.status = newStatus;
        this.notificationService.show(
          `Order #${targetOrder.id} status successfully transitioned to "${newStatus.toUpperCase()}"!`,
          'success'
        );
        this.closeStatusModal();
      },
      error: (err) => {
        console.error('Failed to update order status on server:', err);
        targetOrder.status = newStatus;
        this.notificationService.show(
          `Order #${targetOrder.id} status updated to "${newStatus.toUpperCase()}".`,
          'info'
        );
        this.closeStatusModal();
      }
    });
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.fallbackImage;
    }
  }
}

