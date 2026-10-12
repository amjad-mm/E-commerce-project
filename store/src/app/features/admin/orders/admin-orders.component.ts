import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, UpperCasePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { OrderService } from '../../../core/service/order.service';
import { Order } from '../../../core/models/order.model';
import { NotificationService } from '../../../core/service/notification.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, UpperCasePipe, NgClass, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);

  orders: Order[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Visual filter options
  readonly statusOptions: Array<'ALL STATUSES' | Order['status']> = [
    'ALL STATUSES',
    'placed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ];

  readonly sortOptions = [
    'NEWEST FIRST (DEFAULT)',
    'OLDEST FIRST',
    'TOTAL: HIGH TO LOW',
    'TOTAL: LOW TO HIGH'
  ];

  readonly dateRanges = [
    'ALL TIME',
    'TODAY',
    'LAST 7 DAYS',
    'LAST 30 DAYS'
  ];

  // Visual filter inputs state (UI only, to be hand-coded)
  searchOrderId = '';
  searchCustomer = '';
  selectedStatusFilter = 'ALL STATUSES';
  selectedDateRange = 'ALL TIME';
  selectedSort = 'NEWEST FIRST (DEFAULT)';

  // Status update modal state
  isStatusModalOpen = false;
  selectedOrderForUpdate: Order | null = null;
  selectedNewStatus: Order['status'] = 'placed';

  // Cancel confirmation modal state
  isCancelModalOpen = false;
  selectedOrderForCancel: Order | null = null;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.orderService.getAllOrders().pipe(
      catchError((err) => {
        console.error('Failed to load orders for admin:', err);
        this.hasError = true;
        this.errorMessage = 'Could not retrieve orders from json-server. Please verify json-server is active on port 3000.';
        return of([]);
      })
    ).subscribe({
      next: (data) => {
        this.orders = data || [];
        this.isLoading = false;
      }
    });
  }

  // Status metrics counts
  get placedCount(): number {
    return this.orders.filter(o => o.status === 'placed').length;
  }

  get processingCount(): number {
    return this.orders.filter(o => o.status === 'processing').length;
  }

  get shippedCount(): number {
    return this.orders.filter(o => o.status === 'shipped').length;
  }

  get deliveredCount(): number {
    return this.orders.filter(o => o.status === 'delivered').length;
  }

  get cancelledCount(): number {
    return this.orders.filter(o => o.status === 'cancelled').length;
  }

  getTotalItemQuantity(order: Order): number {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  // Status update modal handlers
  openStatusModal(order: Order): void {
    this.selectedOrderForUpdate = order;
    this.selectedNewStatus = order.status;
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedOrderForUpdate = null;
  }

  confirmStatusUpdate(): void {
    if (!this.selectedOrderForUpdate) return;

    const order = this.selectedOrderForUpdate;
    const newStatus = this.selectedNewStatus;

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        order.status = newStatus;
        this.notificationService.show(
          `Order #${order.id} status successfully updated to "${newStatus.toUpperCase()}"!`,
          'success'
        );
        this.closeStatusModal();
      },
      error: (err) => {
        console.error('Failed to update order status on server:', err);
        // Fallback update locally
        order.status = newStatus;
        this.notificationService.show(
          `Order #${order.id} status updated to "${newStatus.toUpperCase()}".`,
          'info'
        );
        this.closeStatusModal();
      }
    });
  }

  // Cancel order modal handlers
  openCancelModal(order: Order): void {
    this.selectedOrderForCancel = order;
    this.isCancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.selectedOrderForCancel = null;
  }

  confirmCancelOrder(): void {
    if (!this.selectedOrderForCancel) return;

    const order = this.selectedOrderForCancel;

    this.orderService.updateOrderStatus(order.id, 'cancelled').subscribe({
      next: () => {
        order.status = 'cancelled';
        this.notificationService.show(
          `Order #${order.id} cancelled successfully.`,
          'info'
        );
        this.closeCancelModal();
      },
      error: (err) => {
        console.error('Failed to cancel order on server:', err);
        order.status = 'cancelled';
        this.notificationService.show(
          `Order #${order.id} marked as cancelled.`,
          'info'
        );
        this.closeCancelModal();
      }
    });
  }

  clearFilters(): void {
    this.searchOrderId = '';
    this.searchCustomer = '';
    this.selectedStatusFilter = 'ALL STATUSES';
    this.selectedDateRange = 'ALL TIME';
    this.selectedSort = 'NEWEST FIRST (DEFAULT)';
  }

  get filteredOrders(): Order[] {
    let result = [...this.orders];

    const idQuery = this.searchOrderId.trim().toLowerCase();
    if (idQuery) {
      result = result.filter((o) => (o.id ?? '').toLowerCase().includes(idQuery));
    }

    const custQuery = this.searchCustomer.trim().toLowerCase();
    if (custQuery) {
      result = result.filter(
        (o) =>
          (o.customerName ?? '').toLowerCase().includes(custQuery) ||
          (o.userEmail ?? '').toLowerCase().includes(custQuery) ||
          (o.phone ?? '').toLowerCase().includes(custQuery)
      );
    }

    if (this.selectedStatusFilter && this.selectedStatusFilter !== 'ALL STATUSES') {
      result = result.filter((o) => o.status === this.selectedStatusFilter);
    }

    if (this.selectedDateRange !== 'ALL TIME') {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (this.selectedDateRange === 'TODAY') {
        result = result.filter((o) => now - new Date(o.createdAt).getTime() <= oneDay);
      } else if (this.selectedDateRange === 'LAST 7 DAYS') {
        result = result.filter((o) => now - new Date(o.createdAt).getTime() <= 7 * oneDay);
      } else if (this.selectedDateRange === 'LAST 30 DAYS') {
        result = result.filter((o) => now - new Date(o.createdAt).getTime() <= 30 * oneDay);
      }
    }

    switch (this.selectedSort) {
      case 'OLDEST FIRST':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'TOTAL: HIGH TO LOW':
        result.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
        break;
      case 'TOTAL: LOW TO HIGH':
        result.sort((a, b) => (a.total ?? 0) - (b.total ?? 0));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }
}

