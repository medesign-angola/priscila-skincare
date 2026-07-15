import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'org-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
})
export class HeaderComponent {
  theme = input<'white' | 'black'>('white');
  currentLanguage = input<'pt' | 'fr'>('pt');
  currency = input<'AOA' | 'EUR'>('AOA');

  languageChange = output<'pt' | 'fr'>();
  currencyChange = output<'AOA' | 'EUR'>();
}
