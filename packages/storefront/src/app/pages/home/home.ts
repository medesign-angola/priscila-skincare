import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductFacade } from '@org/core';
import { HeroSplitComponent, HeroCoverComponent } from '@org/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroSplitComponent, HeroCoverComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  readonly facade = inject(ProductFacade);

  onBuy(productId: string) {
    console.log('Comprar produto:', productId);
  }
}
