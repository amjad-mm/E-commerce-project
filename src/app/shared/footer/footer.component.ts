import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
email = '';

  onSignUp(): void {
    if (!this.email.trim()) {
      return;
    }

    this.email = '';
  }
}
