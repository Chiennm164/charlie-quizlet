import { Component, input } from '@angular/core';

@Component({
  selector: 'app-text-error',
  standalone: true,
  template: `
    @if (message()) {
      <p class="field__error">{{ message() }}</p>
    }
  `,
})
export class TextErrorComponent {
  message = input<string | null>(null);
}
