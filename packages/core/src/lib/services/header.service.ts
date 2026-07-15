import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  // 'white' for white text/icons (for dark background slides like Home Hero)
  // 'black' for dark text/icons (#1a1917 for light background pages)
  readonly theme = signal<'white' | 'black'>('white');
  readonly currency = signal<'AOA' | 'EUR'>('AOA');
}
