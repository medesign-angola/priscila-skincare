import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-shipping-information-section',
  imports: [TranslatePipe],
  templateUrl: './shipping-information-section.html',
  styleUrl: './shipping-information-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingInformationSection {}
