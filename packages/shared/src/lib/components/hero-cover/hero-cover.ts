import {
  Component,
  input,
  contentChild,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlurUpDirective } from '../../directives/blur-up.directive';

@Component({
  selector: 'org-hero-cover',
  standalone: true,
  imports: [CommonModule, BlurUpDirective],
  templateUrl: './hero-cover.html',
  styleUrl: './hero-cover.css',
})
export class HeroCoverComponent {
  mediaType = input<'image' | 'video'>('video');
  mediaUrl = input.required<string>();
  placeholderUrl = input<string>();
  hasNoise = input<boolean>(false);
  blendMode = input<string>('normal');

  // Query the active BlurUpDirective in the template
  highResMedia = viewChild(BlurUpDirective);

  // Capture nested ng-template via signal content child query
  contentTemplate = contentChild<TemplateRef<any>>('heroContent');
}
