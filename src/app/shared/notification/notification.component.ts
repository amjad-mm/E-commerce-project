import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/service/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {
  readonly notificationService = inject(NotificationService);
}
