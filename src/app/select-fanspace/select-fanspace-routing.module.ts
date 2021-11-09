import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SelectFanspaceComponent } from './select-fanspace/select-fanspace.component';

const routes: Routes = [
  {
    path: '',
    component: SelectFanspaceComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SelectFanspaceRoutingModule { }
