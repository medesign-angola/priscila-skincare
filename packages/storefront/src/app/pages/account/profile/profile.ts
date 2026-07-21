import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '@org/core';

@Component({ selector:'app-profile', imports:[ReactiveFormsModule,TranslatePipe], templateUrl:'./profile.html', styleUrl:'./profile.css', changeDetection:ChangeDetectionStrategy.OnPush })
export class Profile {
  readonly auth=inject(AuthFacade); private readonly router=inject(Router);
  readonly name=new FormControl('',{nonNullable:true});
  constructor(){effect(()=>this.name.setValue(this.auth.customer()?.name??'',{emitEvent:false}));}
  saveName():void{const name=this.name.value.trim();if(name)this.auth.updateName(name);}
  signOut():void{this.auth.signOut();void this.router.navigate(['/entrar']);}
}
