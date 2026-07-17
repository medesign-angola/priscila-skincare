import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({selector:'app-about-pillars-section',imports:[],templateUrl:'./about-pillars-section.html',styleUrl:'./about-pillars-section.css',changeDetection:ChangeDetectionStrategy.OnPush})
export class AboutPillarsSection {
  readonly pillars = [
    { index: '01', title: 'Fórmulas com Ativos', description: 'Nossas fórmulas têm ativos de cuidado da pele altamente concentrados, garantindo resultados visíveis e duradouros para todos os tipos de pele.' },
    { index: '02', title: 'Peles Sensíveis', description: 'Os nossos produtos são testados e aprovados dermatologicamente para todos os tipos de pele, incluindo as mais sensíveis e reativas.' },
    { index: '03', title: 'Certificado de Segurança', description: 'Todos os nossos produtos são certificados com os mais altos padrões de segurança, para que possa confiar em cada aplicação.' },
  ];
}
