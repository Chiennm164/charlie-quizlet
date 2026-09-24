import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoadingComponent } from './shared/ui/global-loading/global-loading';
import { ToastContainerComponent } from './shared/ui/toast/toast';

@Component({
  imports: [RouterOutlet, ToastContainerComponent, GlobalLoadingComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('charlie-quizlet');
}
