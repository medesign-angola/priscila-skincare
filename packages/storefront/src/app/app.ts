import { Component, afterNextRender, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '@org/shared';
import { ProductFacade, HeaderService } from '@org/core';

@Component({
  imports: [RouterModule, HeaderComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly facade = inject(ProductFacade);
  readonly headerService = inject(HeaderService);

  constructor() {
    afterNextRender(async () => {
      const { default: Lenis } = await import('lenis');
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis();

      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    });
  }
}
