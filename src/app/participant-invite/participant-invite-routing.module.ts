import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ParticipantInviteComponent } from './participant-invite/participant-invite.component';

const routes: Routes = [
  {
    path: ':event_code',
    component: ParticipantInviteComponent,
    //children: [
    //  { path: '', redirectTo: 'event-moderator-dashboard' },
    //  { path: 'event-moderator-dashboard', component: EventModeratorDashboardComponent }
    //]
  },
  { path: '**', redirectTo: 'not-found' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ParticipantInviteRoutingModule { }
