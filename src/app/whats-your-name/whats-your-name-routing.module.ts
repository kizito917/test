import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WhatsYourNameComponent } from './whats-your-name/whats-your-name.component';

const routes: Routes = [
  {
    path: '',
    component: WhatsYourNameComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WhatsYourNameRoutingModule { }
