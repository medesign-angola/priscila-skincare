import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({selector:'app-about-locations-section',imports:[],templateUrl:'./about-locations-section.html',styleUrl:'./about-locations-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutLocationsSection { readonly locations=[{title:'Luanda, Angola',description:'Bairro Miramar, Luanda, Angola'},{title:'Encomendar Online',description:'Entregas em todo o território angolano, 3 a 7 dias úteis'},{title:'Envio Internacional',description:'Disponível para todo o mundo'}]; }
