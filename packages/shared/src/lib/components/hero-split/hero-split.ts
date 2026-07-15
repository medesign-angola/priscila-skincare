import { Component, input, contentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlurUpDirective } from '../../directives/blur-up.directive';

@Component({
  selector: 'org-hero-split',
  standalone: true,
  imports: [CommonModule, BlurUpDirective],
  templateUrl: './hero-split.html',
  styleUrl: './hero-split.css',
})
export class HeroSplitComponent {
  mediaUrl = input.required<string>();
  placeholderUrl = input<string>();
  hasNoise = input<boolean>(false);
  blendMode = input<string>('hard-light');

  // Capture nested ng-template via signal content child query
  contentTemplate = contentChild<TemplateRef<any>>('heroContent');
}
