import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from '../../core/config';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { MascotComponent } from '../../shared/ui/mascot/mascot';

/** Trang 404: đường dẫn không khớp route nào (gõ sai URL, link cũ). */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MascotComponent, TranslatePipe],
  template: `
    <section
      class="max-w-md mx-auto py-12 flex flex-col items-center text-center gap-3 anim-slide-up-in"
    >
      <app-mascot mood="sad" class="w-28 h-28" />
      <h1 class="typo-page-title">{{ 'notFound.title' | translate }}</h1>
      <p class="typo-muted">{{ 'notFound.description' | translate }}</p>
      <div class="flex flex-wrap justify-center gap-2 mt-3">
        <a class="btn btn--secondary btn--md" [routerLink]="quizzesRoute">
          {{ 'notFound.browse' | translate }}
        </a>
        <a class="btn btn--primary btn--md" [routerLink]="homeRoute">
          {{ 'forbidden.backHome' | translate }}
        </a>
      </div>
    </section>
  `,
})
export class NotFoundComponent {
  readonly homeRoute = DEFAULT_AUTHENTICATED_ROUTE;
  readonly quizzesRoute = ROUTES.quizzes;
}
