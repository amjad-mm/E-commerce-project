import { Component } from '@angular/core';

@Component({
  selector: 'app-protected-page',
  standalone: true,
  template: `
    <main class="protected-page">
      <h1>Protected area</h1>
      <p>This page is available after authentication.</p>
    </main>
  `,
  styles: [`
    .protected-page {
      min-height: 60vh;
      display: grid;
      place-content: center;
      gap: 8px;
      padding: 48px 24px;
      text-align: center;
    }
  `]
})
export class ProtectedPageComponent {}
