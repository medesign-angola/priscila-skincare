import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
@Component({ selector:'app-account-layout', imports:[RouterOutlet], templateUrl:'./account-layout.html', styleUrl:'./account-layout.css', changeDetection:ChangeDetectionStrategy.OnPush })
export class AccountLayout {}
