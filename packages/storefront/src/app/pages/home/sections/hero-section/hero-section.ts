import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductFacade } from '@org/core';
import {
  HeroCoverComponent,
  HeroSplitComponent,
  PriceFormatPipe,
} from '@org/shared';
import { inject } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  imports: [
    CommonModule,
    HeroCoverComponent,
    HeroSplitComponent,
    PriceFormatPipe,
  ],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  readonly facade = inject(ProductFacade);

  buyKit(kitId: string): void {
    console.log('Comprar kit:', kitId);
  }
}
