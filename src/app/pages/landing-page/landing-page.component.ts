import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ExtraHeaderComponent } from '../../components/extra-header/extra-header.component';
import { MatButtonModule } from '@angular/material/button';
import { BannerComponent } from '../../components/banner/banner.component';
import { NewsListComponent } from '../../components/news-list/news-list.component';
import { NewsletterFormComponent } from '../../components/newsletter-form/newsletter-form.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    ExtraHeaderComponent,
    NgOptimizedImage,
    MatButtonModule,
    BannerComponent,
    NewsListComponent,
    NewsletterFormComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export default class LandingPageComponent {}
