import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@components/button/button.component';
import { TranslationService } from '@services/translation.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent {
  lang = inject(TranslationService);
}
