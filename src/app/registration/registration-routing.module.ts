import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ModeratorSignupComponent } from './moderator-signup/moderator-signup.component';

const routes: Routes = [
  {
    path: '',
    component: ModeratorSignupComponent,
    //children: [
    //  { path: '', redirectTo: 'event-moderator-dashboard' },
    //  { path: 'event-moderator-dashboard', component: EventModeratorDashboardComponent }
    //]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistrationRoutingModule { }
