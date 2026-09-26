import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorDialogComponent } from './core/error/error-dialog/error-dialog';
import { GlobalLoadingComponent } from './shared/ui/global-loading/global-loading';
import { ToastContainerComponent } from './shared/ui/toast/toast';

@Component({
  imports: [RouterOutlet, ToastContainerComponent, GlobalLoadingComponent, ErrorDialogComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
