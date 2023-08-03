import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@components/button/button.component';
import { AppIcons } from '@constants/app-icons';
import { Law } from '@models/law';

@Component({
  selector: 'app-law-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent, RouterModule],
  templateUrl: './law-item.component.html',
  styleUrls: ['./law-item.component.scss'],
})
export class LawItemComponent {
  @Input({ required: true }) lawItemData!: Law;

  icons = AppIcons;

  onDownload(event: Event) {
    event.stopPropagation();
    window.open(this.lawItemData.fileUrl, '_blank');
  }
}
