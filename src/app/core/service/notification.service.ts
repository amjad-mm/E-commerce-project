import { Injectable, signal } from '@angular/core';

export interface NotificationMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly current = signal<NotificationMessage | null>(null);
  private dismissTimer: ReturnType<typeof setTimeout> | undefined;

  show(message: string, type: NotificationMessage['type'] = 'success'): void {
    this.current.set({ message, type });
    this.scheduleDismiss();
  }

  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }

    this.current.set(null);
  }

  private scheduleDismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }

    this.dismissTimer = setTimeout(() => {
      this.current.set(null);
      this.dismissTimer = undefined;
    }, 3000);
  }
}
