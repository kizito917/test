import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WhatWeCallYourFanspaceComponent } from './what-we-call-your-fanspace/what-we-call-your-fanspace.component';

const routes: Routes = [
  {
    path: '',
    component: WhatWeCallYourFanspaceComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WhatWeCallYourFanspaceRoutingModule { }
